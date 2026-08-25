const MASTER_ENGINE_URL =
  "https://script.google.com/macros/s/AKfycbxOv-i4Os3DZiZ5UK_7ccI4Dub4-HJxrV7DISx-gDSK7cGP3a_oVAPvWzrhnw9s2ng7/exec"

export const SPREADSHEET_ID = "1i2J9ByIAerL48eIRYnT9SJLJcUryR0mlkD8uiWjjZPc"
export const MASTER_ENGINE_LOADING_LABEL = "מסנכרן מול SabanOS Master Engine..."
export const MASTER_ENGINE_SUCCESS_MESSAGE =
  "ההזמנה נקלטה בהצלחה. תיקיות Drive וטבלאות הצלבה ובקרה נוצרו אוטומטית."

export interface DictionaryEntry {
  sku?: string
  name?: string
  description?: string
  keywords?: string[] | string
  price?: number
  unit?: string
  [key: string]: unknown
}

export interface NormalizedOrderItem {
  sku: string
  name?: string
  quantity: number
  unitPrice?: number
  total?: number
  [key: string]: unknown
}

export interface DepositSummary {
  pallets?: number
  balas?: number
  [key: string]: unknown
}

export interface NormalizedOrderResult {
  items: NormalizedOrderItem[]
  depositsSummary?: DepositSummary
  crossSellSuggestions?: unknown[]
  [key: string]: unknown
}

export interface MasterOrderData {
  customerName: string
  warehouse: string
  deliveryAddress: string
  items: NormalizedOrderItem[]
  depositsSummary: DepositSummary
  [key: string]: unknown
}

export interface BackendResponse<T = unknown> {
  success?: boolean
  ok?: boolean
  data?: T
  result?: T
  message?: string
  error?: string
  [key: string]: unknown
}

export type DictionaryResponse = BackendResponse<DictionaryEntry[]> & {
  dictionary?: DictionaryEntry[]
}

export type NormalizeResponse = BackendResponse<NormalizedOrderResult> & {
  normalizedOrder?: NormalizedOrderResult
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function responseFailed(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined
  if (body.success === false || body.ok === false) {
    return typeof body.error === "string"
      ? body.error
      : typeof body.message === "string"
        ? body.message
        : "הפעולה נכשלה בשרת"
  }
  return undefined
}

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  let response: Response
  try {
    response = await fetch(MASTER_ENGINE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error(
      `לא ניתן להתחבר ל-SabanOS Master Engine: ${error instanceof Error ? error.message : "שגיאת רשת"}`,
    )
  }

  const rawText = await response.text()
  let body: unknown = rawText
  try {
    body = rawText ? JSON.parse(rawText) : {}
  } catch {
    // Some Apps Script responses are plain text; preserve them for callers.
  }

  if (!response.ok) {
    throw new Error(`Master Engine החזיר שגיאת HTTP ${response.status}`)
  }

  const backendError = responseFailed(body)
  if (backendError) throw new Error(backendError)

  return body as T
}

export async function fetchLiveDictionary(): Promise<DictionaryResponse> {
  return post<DictionaryResponse>({ action: "get_dictionary" })
}

export async function normalizeRawOrder(
  rawMessage: string,
  customerName: string,
): Promise<NormalizeResponse> {
  return post<NormalizeResponse>({
    action: "normalize",
    rawMessage,
    customerName,
  })
}

export async function learnSlangTerm(
  sku: string,
  slangTerm: string,
): Promise<BackendResponse> {
  return post<BackendResponse>({ action: "learn", sku, slangTerm })
}

export async function submitMasterOrder(
  orderData: MasterOrderData,
): Promise<BackendResponse> {
  return post<BackendResponse>({ action: "submit", ...orderData })
}

export { MASTER_ENGINE_URL }
export default {
  fetchLiveDictionary,
  normalizeRawOrder,
  learnSlangTerm,
  submitMasterOrder,
}
