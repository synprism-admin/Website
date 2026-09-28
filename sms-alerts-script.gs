/**
 * SynPrism Sale Alerts - SMS Opt-In Logger
 * ==========================================
 * Deploy this as a Google Apps Script Web App:
 *   Extensions > Apps Script > paste this > Deploy > New deployment
 *   Type: Web app | Execute as: Me | Who has access: Anyone
 *
 * Copy the deployment URL and paste it into sms-alerts.html
 * where it says: action="APPS_SCRIPT_URL_HERE"
 *
 * The sheet "SMS Opt-Ins" will be created automatically on first submission.
 * Columns: Timestamp | Name | Store | Mobile | Consent | Consent Wording | Status
 */

// ── CONFIG ─────────────────────────────────────────────────────────────────

// The Google Sheet where opt-ins are logged.
// Leave blank to auto-create a new sheet in the script's bound spreadsheet,
// OR paste the ID from your sheet's URL: docs.google.com/spreadsheets/d/SPREADSHEET_ID/
const SPREADSHEET_ID = '';

// Sheet tab name
const SHEET_NAME = 'SMS Opt-Ins';

// Send yourself an email when a new opt-in comes in
const NOTIFY_EMAIL = 'info@synprism.io';

// ── MAIN ───────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const params = e.parameter;

    const ownerName     = (params.ownerName     || '').trim();
    const storeName     = (params.storeName     || '').trim();
    const mobile        = (params.mobile        || '').trim();
    const consent       = (params.consent       || '').trim();   // 'on' when checked
    const consentWording = (params.consentWording || '').trim();
    const timestamp     = (params.timestamp     || new Date().toISOString()).trim();

    // Basic validation
    if (!ownerName || !mobile || consent !== 'on') {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }

    // Log to sheet
    const sheet = getOrCreateSheet();
    sheet.appendRow([
      timestamp,
      ownerName,
      storeName,
      mobile,
      'YES - checkbox checked',
      consentWording,
      'Pending Approval'  // Synprism team updates this to 'Active' after linking to store
    ]);

    // Email notification
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: `New SMS Opt-In: ${ownerName} (${storeName})`,
        body: [
          'New SynPrism Sale Alerts opt-in received.',
          '',
          `Name:      ${ownerName}`,
          `Store:     ${storeName}`,
          `Mobile:    ${mobile}`,
          `Consent:   Yes (checkbox checked)`,
          `Timestamp: ${timestamp}`,
          '',
          'Consent wording shown at time of submission:',
          consentWording,
          '',
          '--- Action required ---',
          'Review the submission, link the number to the correct storefront in Twilio,',
          'then update the Status column in the sheet from "Pending Approval" to "Active".',
          '',
          `Sheet: https://docs.google.com/spreadsheets/d/${SpreadsheetApp.getActiveSpreadsheet().getId()}`
        ].join('\n')
      });
    }

    return jsonResponse({ success: true });

  } catch (err) {
    console.error(err);
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Handle GET (form page testing / health check)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'SynPrism Sale Alerts opt-in endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function getOrCreateSheet() {
  let ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Header row
    const headers = [
      'Timestamp',
      'Owner Name',
      'Store / Business',
      'Mobile Number',
      'Consent',
      'Consent Wording Shown',
      'Status'
    ];
    sheet.appendRow(headers);

    // Style header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0d1128');
    headerRange.setFontColor('#00d4ff');

    // Freeze header row
    sheet.setFrozenRows(1);

    // Column widths
    sheet.setColumnWidth(1, 200);  // Timestamp
    sheet.setColumnWidth(2, 160);  // Name
    sheet.setColumnWidth(3, 180);  // Store
    sheet.setColumnWidth(4, 150);  // Mobile
    sheet.setColumnWidth(5, 120);  // Consent
    sheet.setColumnWidth(6, 400);  // Consent Wording
    sheet.setColumnWidth(7, 140);  // Status
  }

  return sheet;
}

function jsonResponse(obj) {
  // CORS headers so the fetch() in the browser doesn't get blocked
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
