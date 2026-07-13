import { NextResponse } from "next/server"

const ORDERS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwCmP_-X5Imkq7xYzaLbyTy_TWKJPjYx-KpcuPRmnzjhrRwWXGaQ5nbWLtL5atlg2PQ/exec"

// Always fetch fresh data — this is a live sync endpoint.
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const res = await fetch(ORDERS_ENDPOINT, {
      // Follow Apps Script redirects and never cache.
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })

    const text = await res.text()

    // Apps Script often returns an HTML error page instead of a JSON error.
    const looksLikeHtml = text.trimStart().startsWith("<")
    if (!res.ok || looksLikeHtml) {
      return NextResponse.json(
        {
          error:
            "The orders source did not return valid data. It may be offline or misconfigured.",
        },
        { status: 502 },
      )
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { error: "Received a malformed response from the orders source." },
        { status: 502 },
      )
    }

    return NextResponse.json({ orders: normalizeOrders(data) })
  } catch {
    return NextResponse.json(
      { error: "Could not reach the orders source. Check your connection and try again." },
      { status: 502 },
    )
  }
}

// The upstream sheet may wrap rows in different keys or casings — normalize them.
function normalizeOrders(data: unknown) {
  const rows: any[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.orders)
      ? (data as any).orders
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : []

  return rows.map((row, index) => {
    const get = (...keys: string[]) => {
      for (const key of keys) {
        const match = Object.keys(row).find(
          (k) => k.toLowerCase().replace(/[\s_]/g, "") === key.toLowerCase().replace(/[\s_]/g, ""),
        )
        if (match && row[match] != null && String(row[match]).trim() !== "") {
          return String(row[match])
        }
      }
      return ""
    }

    return {
      id: get("id", "orderid", "rowid") || `row-${index}`,
      orderNumber: get("orderNumber", "order", "ordernum", "number", "מספרהזמנה"),
      customerName: get("customerName", "customer", "client", "name", "לקוח"),
      warehouse: get("warehouse", "depot", "location", "מחסן"),
      status: get("status", "state", "סטטוס"),
    }
  })
}
