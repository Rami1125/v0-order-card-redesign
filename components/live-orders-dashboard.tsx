"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Package,
  RefreshCw,
  Warehouse,
  User,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  LayoutGrid,
  Table as TableIcon,
  Boxes,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Order {
  id: string
  orderNumber: string
  customerName: string
  warehouse: string
  status: string
}

type FetchState = "idle" | "loading" | "success" | "error"

function statusMeta(status: string) {
  const key = status.toLowerCase()
  if (/(deliver|complete|done|נמסר|הושלם)/.test(key))
    return { label: status || "Delivered", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", Icon: CheckCircle2 }
  if (/(transit|way|ship|בדרך|נשלח)/.test(key))
    return { label: status || "In Transit", className: "border-blue-500/30 bg-blue-500/10 text-blue-400", Icon: Truck }
  if (/(cancel|fail|בוטל|נכשל)/.test(key))
    return { label: status || "Cancelled", className: "border-rose-500/30 bg-rose-500/10 text-rose-400", Icon: AlertTriangle }
  if (/(pend|wait|process|ready|prepar|ממתין|בהכנה|מוכן)/.test(key))
    return { label: status || "Pending", className: "border-amber-500/30 bg-amber-500/10 text-amber-400", Icon: Clock }
  return { label: status || "Unknown", className: "border-border bg-muted/40 text-muted-foreground", Icon: Package }
}

export default function LiveOrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [state, setState] = useState<FetchState>("idle")
  const [error, setError] = useState<string>("")
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "table">("grid")

  const syncOrders = useCallback(async () => {
    setState("loading")
    setError("")
    try {
      const res = await fetch("/api/orders", { cache: "no-store" })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to load orders.")
      setOrders(Array.isArray(body.orders) ? body.orders : [])
      setLastSynced(new Date())
      setState("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while syncing.")
      setState("error")
    }
  }, [])

  useEffect(() => {
    syncOrders()
  }, [syncOrders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((o) =>
      [o.orderNumber, o.customerName, o.warehouse, o.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [orders, search])

  const stats = useMemo(() => {
    const warehouses = new Set(orders.map((o) => o.warehouse).filter(Boolean))
    const delivered = orders.filter((o) => /(deliver|complete|done|נמסר|הושלם)/.test(o.status.toLowerCase())).length
    return { total: orders.length, warehouses: warehouses.size, delivered }
  }, [orders])

  const isLoading = state === "loading"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Boxes className="size-6" />
            </div>
            <div>
              <h1 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">
                SabanOS Logistics
              </h1>
              <p className="text-sm text-muted-foreground">
                Live order operations dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {lastSynced
                ? `Last synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Not synced yet"}
            </span>
            <Button onClick={syncOrders} disabled={isLoading} className="font-semibold">
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
              {isLoading ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </header>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Package} label="Total Orders" value={stats.total} tint="text-primary" />
          <StatCard icon={Warehouse} label="Active Warehouses" value={stats.warehouses} tint="text-accent" />
          <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered} tint="text-emerald-400" />
        </section>

        {/* Toolbar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, customers, warehouses..."
              className="pl-9"
              aria-label="Search orders"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <ViewToggle active={view === "grid"} onClick={() => setView("grid")} icon={LayoutGrid} label="Grid view" />
            <ViewToggle active={view === "table"} onClick={() => setView("table")} icon={TableIcon} label="Table view" />
          </div>
        </div>

        {/* Content */}
        <section className="mt-6">
          {isLoading && orders.length === 0 && <LoadingState view={view} />}

          {state === "error" && orders.length === 0 && (
            <ErrorState message={error} onRetry={syncOrders} />
          )}

          {state !== "error" && !isLoading && filtered.length === 0 && orders.length === 0 && (
            <EmptyState />
          )}

          {filtered.length > 0 && (
            <>
              {state === "error" && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                  <AlertTriangle className="size-4 shrink-0 text-destructive" />
                  <span>Showing cached data. Last sync failed: {error}</span>
                </div>
              )}
              {view === "grid" ? <OrderGrid orders={filtered} /> : <OrderTable orders={filtered} />}
            </>
          )}

          {filtered.length === 0 && orders.length > 0 && (
            <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
              No orders match &ldquo;{search}&rdquo;.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ElementType
  label: string
  value: number
  tint: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <div className={cn("flex size-11 items-center justify-center rounded-xl bg-muted/40", tint)}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-black tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function OrderGrid({ orders }: { orders: Order[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => {
        const meta = statusMeta(order.status)
        return (
          <article
            key={order.id}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-mono font-semibold text-muted-foreground">
                <Package className="size-4 text-primary" />
                #{order.orderNumber || "—"}
              </div>
              <Badge variant="outline" className={cn("gap-1 font-medium", meta.className)}>
                <meta.Icon className="size-3" />
                {meta.label}
              </Badge>
            </div>

            <h3 className="mt-4 flex items-center gap-2 text-lg font-bold">
              <User className="size-4 text-muted-foreground" />
              {order.customerName || "Unknown customer"}
            </h3>

            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Warehouse className="size-4" />
              {order.warehouse || "Unassigned warehouse"}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const meta = statusMeta(order.status)
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono font-semibold">#{order.orderNumber || "—"}</TableCell>
                <TableCell className="font-medium">{order.customerName || "Unknown customer"}</TableCell>
                <TableCell className="text-muted-foreground">{order.warehouse || "Unassigned"}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn("gap-1 font-medium", meta.className)}>
                    <meta.Icon className="size-3" />
                    {meta.label}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function LoadingState({ view }: { view: "grid" | "table" }) {
  const items = Array.from({ length: 6 })
  if (view === "table") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {items.map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold">Unable to load orders</h3>
      <p className="mt-1 max-w-md text-pretty text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline" className="mt-6 font-semibold">
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
        <Package className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold">No orders yet</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Once orders arrive from your source, they&apos;ll appear here. Try syncing again.
      </p>
    </div>
  )
}
