/**
 * SabanOS Logistics - Google Sheet to Firebase Firestore Sync Engine
 * 
 * This script is designed to run in Google Apps Script (GAS).
 * It fetches live order log rows from a Google Sheet, parses multi-line item lists
 * into structured JSON, sanitizes and transforms types (Dates to ISO, numbers to floats),
 * and syncs them securely to Firebase Firestore using direct REST API calls.
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet linked to SabanOS.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this entire script.
 * 4. Go to Project Settings (gear icon) -> Script Properties.
 * 5. Add a property named FIREBASE_API_KEY with your API key value.
 * 6. Run the `syncSheetToFirebase` function manually to test.
 * 7. (Optional) Set up a time-driven trigger (e.g., every 5 minutes) to automate syncing.
 */

// =========================================================================
// Configuration Constants
// =========================================================================
const SHEET_ID = "1Y_2N4Gs-lvAiv8fvLk9zvIhVQt5YxNPz6mCOnlh6lh8";
const SHEET_NAME = "לוג_הזמנות_מערכת";
const FIREBASE_PROJECT_ID = "gen-lang-client-0262645162";
const FIREBASE_DATABASE_ID = "ai-studio-sabanosenterpris-8ad4b65f-f5d9-4535-b28a-1f69f6cd447e";

// Secure API Key extraction
const FIREBASE_API_KEY = PropertiesService.getScriptProperties().getProperty("FIREBASE_API_KEY");

// Firestore Collection Name
const COLLECTION_NAME = "orders";
const SYNC_STATUS_HEADER = "סטטוס סנכרון";

// Product Catalog Prices (matching SabanOS catalog)
const PRODUCT_PRICES = {
  'SBN-PL-01': 85,
  'SBN-ST-05': 42,
  'SBN-TP-12': 18,
  'SBN-BB-08': 65,
  'SBN-ST-22': 120,
  'SBN-LB-40': 35,
  'SBN-BX-10': 95,
  'SBN-CN-03': 110,
};

/**
 * Main Trigger Function: Syncs Sheet rows to Firebase Firestore
 */
function syncSheetToFirebase() {
  console.log("=== Starting SabanOS Sheet-to-Firebase Sync ===");
  
  if (!FIREBASE_API_KEY) {
    console.error("FATAL: FIREBASE_API_KEY is missing from Script Properties.");
    return;
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    if (!spreadsheet) {
      throw new Error("Unable to open Google Spreadsheet with ID: " + SHEET_ID);
    }
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error("Sheet tab named '" + SHEET_NAME + "' not found in the spreadsheet.");
    }
    
    const lastRow = sheet.getLastRow();
    let lastCol = sheet.getLastColumn();
    
    console.log("Found Sheet: " + SHEET_NAME + " with " + lastRow + " rows and " + lastCol + " columns.");
    
    if (lastRow < 2) {
      console.log("No order rows to sync (only header or empty sheet).");
      return;
    }
    
    const allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = allData[0];
    const rows = allData.slice(1);
    
    const colIndices = findColumnIndices(headers);
    
    // Create Sync Status column if it doesn't exist
    if (colIndices.syncStatus === -1) {
      colIndices.syncStatus = lastCol;
      sheet.getRange(1, lastCol + 1).setValue(SYNC_STATUS_HEADER);
      lastCol++;
    }
    
    console.log("Mapped column indices: " + JSON.stringify(colIndices));
    
    let syncCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;
      
      // Skip if already synced
      if (row[colIndices.syncStatus] === 'Synced') {
        continue;
      }
      
      const rawOrderNo = row[colIndices.orderNumber];
      if (!rawOrderNo || String(rawOrderNo).trim() === "") {
        console.log("Skipping Row #" + rowIndex + ": Order Number is empty.");
        continue;
      }
      
      const orderNumber = String(rawOrderNo).trim();
      
      try {
        const rawDate = row[colIndices.timestamp];
        const customerName = String(row[colIndices.customerName] || 'לקוח לא ידוע').trim();
        const warehouse = String(row[colIndices.warehouse] || 'מחסן החרש').trim();
        const deliveryAddress = String(row[colIndices.deliveryAddress] || '').trim();
        const itemsRaw = String(row[colIndices.items] || '').trim();
        const statusRaw = String(row[colIndices.status] || 'pending').trim().toLowerCase();
        const notes = row[colIndices.notes] ? String(row[colIndices.notes]).trim() : undefined;
        const modelUsed = row[colIndices.modelUsed] ? String(row[colIndices.modelUsed]).trim() : undefined;
        const tokens = row[colIndices.tokens] ? Number(row[colIndices.tokens]) : undefined;
        const messageId = row[colIndices.messageId] ? String(row[colIndices.messageId]).trim() : undefined;
        
        const latitude = colIndices.latitude !== -1 && row[colIndices.latitude] ? Number(row[colIndices.latitude]) : undefined;
        const longitude = colIndices.longitude !== -1 && row[colIndices.longitude] ? Number(row[colIndices.longitude]) : undefined;
        
        let timestampIso = "";
        if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          timestampIso = rawDate.toISOString();
        } else if (rawDate) {
          try {
            timestampIso = new Date(rawDate).toISOString();
          } catch (e) {
            timestampIso = new Date().toISOString();
          }
        } else {
          timestampIso = new Date().toISOString();
        }
        
        const status = ['pending', 'processing', 'delivered', 'cancelled'].indexOf(statusRaw) !== -1 
          ? statusRaw 
          : 'pending';
          
        const items = parseItemsString(itemsRaw, rowIndex);
        
        const totalAmount = items.reduce(function(sum, item) {
          return sum + (item.price * item.quantity);
        }, 0);
        
        const orderPayload = {
          id: orderNumber,
          orderNumber: orderNumber,
          timestamp: timestampIso,
          customerName: customerName,
          warehouse: warehouse,
          deliveryAddress: deliveryAddress,
          items: items,
          itemsRawString: itemsRaw,
          status: status,
          totalAmount: totalAmount
        };
        
        if (notes) orderPayload.notes = notes;
        if (modelUsed) orderPayload.modelUsed = modelUsed;
        if (tokens && !isNaN(tokens)) orderPayload.tokens = tokens;
        if (messageId) orderPayload.messageId = messageId;
        if (latitude && !isNaN(latitude)) orderPayload.latitude = latitude;
        if (longitude && !isNaN(longitude)) orderPayload.longitude = longitude;
        
        // Sync document to Firestore
        syncToFirestoreRest(orderNumber, orderPayload);
        
        // Mark as synced in the sheet
        sheet.getRange(rowIndex, colIndices.syncStatus + 1).setValue('Synced');
        syncCount++;
        
      } catch (rowError) {
        console.error("Error processing Row #" + rowIndex + " (Order " + orderNumber + "): " + rowError.toString());
        sheet.getRange(rowIndex, colIndices.syncStatus + 1).setValue('Error');
        errorCount++;
      }
    }
    
    console.log("=== Sync complete. Successfully synced: " + syncCount + " orders. Errors: " + errorCount + " ===");
    
  } catch (globalError) {
    console.error("FATAL ERROR in syncSheetToFirebase: " + globalError.toString());
  }
}

/**
 * Finds column indexes based on header names dynamically to support reordered sheets
 */
function findColumnIndices(headers) {
  const indices = {
    timestamp: 0,
    orderNumber: 1,
    customerName: 2,
    warehouse: 3,
    deliveryAddress: 4,
    items: 5,
    status: 6,
    notes: 7,
    modelUsed: 8,
    tokens: 9,
    messageId: 10,
    latitude: -1,
    longitude: -1,
    syncStatus: -1
  };
  
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).trim().toLowerCase();
    
    if (header.indexOf("תאריך") !== -1 || header.indexOf("זמן") !== -1 || header === "timestamp" || header === "date") {
      indices.timestamp = i;
    } else if (header.indexOf("מספר הזמנה") !== -1 || header.indexOf("הזמנה") !== -1 || header === "ordernumber" || header === "order" || header === "order_no") {
      indices.orderNumber = i;
    } else if (header.indexOf("לקוח") !== -1 || header === "customername" || header === "customer") {
      indices.customerName = i;
    } else if (header.indexOf("מחסן") !== -1 || header === "warehouse") {
      indices.warehouse = i;
    } else if (header.indexOf("כתובת") !== -1 || header === "deliveryaddress" || header === "address") {
      indices.deliveryAddress = i;
    } else if (header.indexOf("פריטים") !== -1 || header.indexOf("תכולה") !== -1 || header === "items" || header === "itemsraw" || header === "products") {
      indices.items = i;
    } else if (header.indexOf("סטטוס סנכרון") !== -1 || header === "sync status" || header === "syncstatus") {
      indices.syncStatus = i;
    } else if (header.indexOf("סטטוס") !== -1 || header.indexOf("מצב") !== -1 || header === "status") {
      indices.status = i;
    } else if (header.indexOf("הערות") !== -1 || header === "notes") {
      indices.notes = i;
    } else if (header.indexOf("מודל") !== -1 || header === "modelused" || header === "model") {
      indices.modelUsed = i;
    } else if (header.indexOf("טוקנים") !== -1 || header === "tokens") {
      indices.tokens = i;
    } else if (header.indexOf("הודעה") !== -1 || header === "messageid") {
      indices.messageId = i;
    } else if (header.indexOf("קו רוחב") !== -1 || header === "latitude" || header === "lat") {
      indices.latitude = i;
    } else if (header.indexOf("קו אורך") !== -1 || header === "longitude" || header === "lng") {
      indices.longitude = i;
    }
  }
  
  return indices;
}

/**
 * Elegant multi-line items string parser
 * Parses "[SKU] Name - Qty" format separated by newlines or semicolons
 */
function parseItemsString(itemsStr, orderIdx) {
  if (!itemsStr) return [];
  
  const lines = itemsStr.split(/[\n\r;]+/).map(function(line) {
    return line.trim();
  }).filter(function(line) {
    return line.length > 0;
  });
  
  return lines.map(function(line, itemIdx) {
    let sku = 'SBN-GEN-99';
    let name = line;
    let quantity = 1;
    
    const skuMatch = line.match(/^\[([^\]]+)\]/);
    if (skuMatch) {
      sku = skuMatch[1].trim();
      name = line.substring(skuMatch[0].length).trim();
    }
    
    const qtyMatch = name.match(/(?:\s*[-xX:]\s*|\s+)(\d+)\s*$/);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10) || 1;
      name = name.substring(0, qtyMatch.index).trim();
    }
    
    name = name.replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
    const price = PRODUCT_PRICES[sku] || 50;
    
    return {
      id: "item-" + orderIdx + "-" + itemIdx + "-" + sku,
      sku: sku,
      name: name || 'פריט לוגיסטי',
      price: price,
      quantity: quantity
    };
  });
}

/**
 * Direct Firebase Firestore REST API connection
 * Uses PATCH method with query mask to write/merge the document cleanly.
 */
function syncToFirestoreRest(documentId, orderPayload) {
  const url = "https://firestore.googleapis.com/v1/projects/" 
    + FIREBASE_PROJECT_ID 
    + "/databases/" 
    + FIREBASE_DATABASE_ID 
    + "/documents/" 
    + COLLECTION_NAME 
    + "/" 
    + encodeURIComponent(documentId)
    + "?key=" 
    + FIREBASE_API_KEY;
    
  const firestoreDoc = toFirestoreDoc(orderPayload);
  
  const options = {
    method: "patch",
    contentType: "application/json",
    payload: JSON.stringify(firestoreDoc),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode >= 200 && responseCode < 300) {
    console.log("Successfully synced order " + documentId + " to Firestore.");
  } else {
    throw new Error("Firestore REST API returned error status " + responseCode + ": " + responseText);
  }
}

/**
 * Helper to convert a plain JavaScript object value into Firestore REST API value types
 */
function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    } else {
      return { doubleValue: val };
    }
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const key in val) {
      if (val.hasOwnProperty(key)) {
        fields[key] = toFirestoreValue(val[key]);
      }
    }
    return {
      mapValue: {
        fields: fields
      }
    };
  }
  return { stringValue: String(val) };
}

/**
 * Helper to convert plain JS object into Firestore REST doc representation
 */
function toFirestoreDoc(obj) {
  const fields = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      fields[key] = toFirestoreValue(obj[key]);
    }
  }
  return { fields: fields };
}
