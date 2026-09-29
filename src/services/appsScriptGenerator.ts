import { EmailTemplate } from '../types';

export function generateAppsScriptCode(
  template: EmailTemplate,
  spreadsheetId?: string,
  formUrl?: string
): string {
  const safeSubject = JSON.stringify(template.subject);
  const safeGreeting = JSON.stringify(template.greeting);
  const safeBody = JSON.stringify(template.body);
  const safeSignature = JSON.stringify(template.signature);
  const safeOwnerEmail = JSON.stringify(template.ownerEmail || 'kerissanaicker1@gmail.com');
  const safeCtaText = JSON.stringify(template.ctaText);
  const safeCtaUrl = JSON.stringify(template.ctaUrl);
  const safeSendCopy = template.sendCopyToOwner ? 'true' : 'false';

  return `/**
 * ============================================================================
 * GOOGLE WORKSPACE CRM — AUTOMATED WELCOME EMAIL SCRIPT
 * ============================================================================
 * 
 * Target Owner Email: ${template.ownerEmail || 'kerissanaicker1@gmail.com'}
 * Connected Spreadsheet ID: ${spreadsheetId || 'ACTIVE_SPREADSHEET'}
 * ${formUrl ? `Connected Form: ${formUrl}` : ''}
 * 
 * INSTRUCTIONS:
 * 1. Open your CRM Google Sheet.
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any existing sample code in the editor, and paste this entire file.
 * 4. Click the Save icon (💾) or press Ctrl+S / Cmd+S.
 * 5. In the left sidebar of Apps Script, click Triggers (clock icon ⏰).
 * 6. Click "+ Add Trigger" in the bottom-right corner:
 *    - Choose which function to run: onFormSubmitTrigger
 *    - Choose which deployment: Head
 *    - Select event source: From spreadsheet
 *    - Select event type: On form submit (or On change / On edit)
 * 7. Click Save, and authorize the script when prompted.
 * ============================================================================
 */

// CRM Configuration
const CRM_CONFIG = {
  OWNER_EMAIL: ${safeOwnerEmail},
  SEND_COPY_TO_OWNER: ${safeSendCopy},
  SUBJECT_TEMPLATE: ${safeSubject},
  GREETING_TEMPLATE: ${safeGreeting},
  BODY_TEMPLATE: ${safeBody},
  SIGNATURE_TEMPLATE: ${safeSignature},
  CTA_TEXT: ${safeCtaText},
  CTA_URL: ${safeCtaUrl},
  
  // Spreadsheet Column Indexes (1-based for Apps Script)
  COL_TIMESTAMP: 1,      // Col A
  COL_NAME: 2,           // Col B
  COL_EMAIL: 3,          // Col C
  COL_PHONE: 4,          // Col D
  COL_COMPANY: 5,        // Col E
  COL_SERVICE: 6,        // Col F
  COL_BUDGET: 7,         // Col G
  COL_STATUS: 8,         // Col H
  COL_EMAIL_SENT: 9,     // Col I: 'Welcome Email Sent'
  COL_EMAIL_TIME: 10,    // Col J: 'Email Timestamp'
  COL_NOTES: 11          // Col K: 'Internal Notes'
};

/**
 * Automatically triggers when a Google Form response is submitted to this Sheet.
 */
function onFormSubmitTrigger(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      Logger.log("No data rows found.");
      return;
    }

    // Process the newly added row
    processLeadRow(sheet, lastRow);
  } catch (error) {
    Logger.log("Error in onFormSubmitTrigger: " + error.toString());
    MailApp.sendEmail(CRM_CONFIG.OWNER_EMAIL, "⚠️ CRM Apps Script Trigger Alert", "An error occurred during form submission processing:\\n\\n" + error.toString());
  }
}

/**
 * Process a specific row in the spreadsheet, check if welcome email was sent, and send if pending.
 */
function processLeadRow(sheet, rowNumber) {
  const rowValues = sheet.getRange(rowNumber, 1, 1, 11).getValues()[0];
  
  const timestamp = rowValues[CRM_CONFIG.COL_TIMESTAMP - 1];
  const fullName = String(rowValues[CRM_CONFIG.COL_NAME - 1] || "").trim();
  const clientEmail = String(rowValues[CRM_CONFIG.COL_EMAIL - 1] || "").trim();
  const phone = String(rowValues[CRM_CONFIG.COL_PHONE - 1] || "").trim();
  const company = String(rowValues[CRM_CONFIG.COL_COMPANY - 1] || "").trim();
  const service = String(rowValues[CRM_CONFIG.COL_SERVICE - 1] || "").trim();
  const budgetNotes = String(rowValues[CRM_CONFIG.COL_BUDGET - 1] || "").trim();
  const emailSentStatus = String(rowValues[CRM_CONFIG.COL_EMAIL_SENT - 1] || "").toUpperCase();

  // Validate email and prevent double-sending
  if (!clientEmail || !clientEmail.includes("@")) {
    Logger.log("Row " + rowNumber + " has no valid email address: " + clientEmail);
    return;
  }

  if (emailSentStatus === "TRUE" || emailSentStatus === "YES" || emailSentStatus === "SENT") {
    Logger.log("Row " + rowNumber + " (" + clientEmail + ") has already received a welcome email. Skipping.");
    return;
  }

  // Generate personalized email content
  const firstName = fullName.split(" ")[0] || fullName || "Valued Client";
  const companyDisplay = company || "your company";
  const serviceDisplay = service || "our services";

  const replacePlaceholders = function(text) {
    return text
      .replace(/{{Full Name}}/g, fullName)
      .replace(/{{First Name}}/g, firstName)
      .replace(/{{Company}}/g, companyDisplay)
      .replace(/{{Service}}/g, serviceDisplay)
      .replace(/{{Email}}/g, clientEmail)
      .replace(/{{Owner Email}}/g, CRM_CONFIG.OWNER_EMAIL);
  };

  const subject = replacePlaceholders(CRM_CONFIG.SUBJECT_TEMPLATE);
  const greeting = replacePlaceholders(CRM_CONFIG.GREETING_TEMPLATE);
  const bodyText = replacePlaceholders(CRM_CONFIG.BODY_TEMPLATE);
  const signatureText = replacePlaceholders(CRM_CONFIG.SIGNATURE_TEMPLATE);

  const plainMessage = greeting + "\\n\\n" +
    bodyText + "\\n\\n" +
    "--- Your Inquiry Details ---\\n" +
    "Service Requested: " + serviceDisplay + "\\n" +
    (company ? "Company: " + company + "\\n" : "") +
    (budgetNotes ? "Notes: " + budgetNotes + "\\n" : "") +
    "\\n" +
    (CRM_CONFIG.CTA_TEXT && CRM_CONFIG.CTA_URL ? CRM_CONFIG.CTA_TEXT + ": " + CRM_CONFIG.CTA_URL + "\\n\\n" : "") +
    signatureText;

  const htmlBody = 
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
      '<div style="background-color: #1e3a8a; color: #ffffff; padding: 24px; text-align: left;">' +
        '<h2 style="margin: 0; font-size: 20px;">Welcome to Our Client Portal</h2>' +
      '</div>' +
      '<div style="padding: 24px;">' +
        '<p style="font-size: 16px; font-weight: bold; color: #111827;">' + greeting + '</p>' +
        '<div style="margin: 16px 0; white-space: pre-line; color: #374151;">' + bodyText + '</div>' +
        '<div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 14px; margin: 18px 0; border-radius: 4px;">' +
          '<p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #4b5563;">Inquiry Overview</p>' +
          '<p style="margin: 2px 0; font-size: 14px;"><strong>Service:</strong> ' + serviceDisplay + '</p>' +
          (company ? '<p style="margin: 2px 0; font-size: 14px;"><strong>Company:</strong> ' + company + '</p>' : '') +
          (budgetNotes ? '<p style="margin: 2px 0; font-size: 14px;"><strong>Project Scope:</strong> ' + budgetNotes + '</p>' : '') +
        '</div>' +
        (CRM_CONFIG.CTA_TEXT && CRM_CONFIG.CTA_URL ? '<p style="margin: 20px 0;"><a href="' + CRM_CONFIG.CTA_URL + '" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">' + CRM_CONFIG.CTA_TEXT + '</a></p>' : '') +
        '<p style="margin-top: 24px; color: #4b5563; font-size: 14px;">' + signatureText.replace(/\\n/g, '<br>') + '</p>' +
      '</div>' +
      '<div style="background-color: #f9fafb; padding: 12px 24px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">' +
        'Automated Welcome Dispatch • Google Workspace CRM System' +
      '</div>' +
    '</div>';

  // Send Email via Gmail / MailApp
  GmailApp.sendEmail(clientEmail, subject, plainMessage, {
    htmlBody: htmlBody,
    name: "CRM Client Intake",
    replyTo: CRM_CONFIG.OWNER_EMAIL,
    cc: CRM_CONFIG.SEND_COPY_TO_OWNER && CRM_CONFIG.OWNER_EMAIL !== clientEmail ? CRM_CONFIG.OWNER_EMAIL : undefined
  });

  // Mark in Spreadsheet: Col I = TRUE, Col J = Timestamp
  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  sheet.getRange(rowNumber, CRM_CONFIG.COL_EMAIL_SENT).setValue("TRUE");
  sheet.getRange(rowNumber, CRM_CONFIG.COL_EMAIL_TIME).setValue(nowStr);
  
  // Set default status to 'New' if empty
  const currentStatus = sheet.getRange(rowNumber, CRM_CONFIG.COL_STATUS).getValue();
  if (!currentStatus) {
    sheet.getRange(rowNumber, CRM_CONFIG.COL_STATUS).setValue("New");
  }

  Logger.log("✅ Successfully sent welcome email to " + clientEmail + " for row " + rowNumber);
}

/**
 * Scan all rows in the active sheet and send welcome emails to any pending clients.
 */
function sendPendingWelcomeEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No leads found in this spreadsheet.");
    return;
  }

  let sentCount = 0;
  for (let r = 2; r <= lastRow; r++) {
    const status = String(sheet.getRange(r, CRM_CONFIG.COL_EMAIL_SENT).getValue() || "").toUpperCase();
    const email = String(sheet.getRange(r, CRM_CONFIG.COL_EMAIL).getValue() || "").trim();

    if (email && email.includes("@") && status !== "TRUE" && status !== "YES") {
      processLeadRow(sheet, r);
      sentCount++;
    }
  }

  SpreadsheetApp.getUi().alert("CRM Automation Complete\\n\\nSent " + sentCount + " pending welcome email(s).");
}

/**
 * Test function: Send a sample welcome email to the owner email (${template.ownerEmail || 'kerissanaicker1@gmail.com'})
 */
function runTestEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dummyRow = sheet.getLastRow() + 1;

  // Insert a test row
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([
    now,
    "Test Client (Jane Doe)",
    CRM_CONFIG.OWNER_EMAIL,
    "+1 (555) 019-2834",
    "Acme Innovations",
    "Web & App Development",
    "Test run from Google Apps Script",
    "New",
    "FALSE",
    "",
    "Test submission"
  ]);

  // Process the test row
  processLeadRow(sheet, dummyRow);

  SpreadsheetApp.getUi().alert("✅ Test Run Complete!\\n\\nA test lead was appended and a welcome email was sent to: " + CRM_CONFIG.OWNER_EMAIL);
}

/**
 * Add custom CRM Menu to Google Sheet UI on open
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 CRM Automation")
    .addItem("📨 Send Pending Welcome Emails", "sendPendingWelcomeEmails")
    .addItem("🧪 Run Email Trigger Test", "runTestEmail")
    .addToUi();
}
`;
}
