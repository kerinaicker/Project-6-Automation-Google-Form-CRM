import { ClientLead, GoogleSheetConfig } from '../types';

export const CRM_HEADERS = [
  'Timestamp',
  'Full Name',
  'Email Address',
  'Phone Number',
  'Company',
  'Service Interested In',
  'Budget / Notes',
  'Status',
  'Welcome Email Sent',
  'Email Timestamp',
  'Internal Notes',
];

export async function createCrmSpreadsheet(
  accessToken: string,
  title: string = 'Google Workspace CRM - Client Leads'
): Promise<GoogleSheetConfig> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Client Leads',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Sheet (${createRes.status}): ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetName = 'Client Leads';

  // Populate header row with styling
  const headerRange = `'${sheetName}'!A1:K1`;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      headerRange
    )}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: headerRange,
        majorDimension: 'ROWS',
        values: [CRM_HEADERS],
      }),
    }
  );

  // Format header row with blue/indigo background and bold text
  try {
    const sheetTabId = sheetData.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetTabId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.23, blue: 0.54 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 10,
                  },
                  horizontalAlignment: 'LEFT',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Header formatting optional step:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title,
    sheetName,
    rowCount: 0,
    lastSynced: new Date().toLocaleTimeString(),
  };
}

export async function fetchSpreadsheetMetadata(accessToken: string, spreadsheetId: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch spreadsheet metadata: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchLeadsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  targetSheetName?: string
): Promise<{ leads: ClientLead[]; sheetName: string; title: string }> {
  // Determine active sheet tab name
  let sheetName = targetSheetName;
  let title = 'CRM Spreadsheet';

  if (!sheetName) {
    const meta = await fetchSpreadsheetMetadata(accessToken, spreadsheetId);
    title = meta.properties?.title || 'CRM Spreadsheet';
    sheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';
  }

  const range = `'${sheetName}'!A1:K1000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to load leads from Sheet: ${await res.text()}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  if (rows.length <= 1) {
    return { leads: [], sheetName, title };
  }

  // Parse rows (index 0 is header)
  const leads: ClientLead[] = rows.slice(1).map((row, idx) => {
    const rowIndex = idx + 2; // 1-based, +1 for header
    const emailSentRaw = (row[8] || '').toString().toUpperCase();
    const isEmailSent = emailSentRaw === 'TRUE' || emailSentRaw === 'YES' || emailSentRaw === 'SENT';

    return {
      id: `lead-${rowIndex}-${row[2] || idx}`,
      rowIndex,
      timestamp: row[0] || new Date().toISOString(),
      fullName: row[1] || 'Unknown Contact',
      email: row[2] || '',
      phone: row[3] || '',
      company: row[4] || '',
      service: row[5] || 'General Inquiry',
      budgetNotes: row[6] || '',
      status: (row[7] as any) || 'New',
      welcomeEmailSent: isEmailSent,
      welcomeEmailDate: row[9] || '',
      notes: row[10] || '',
    };
  });

  return { leads, sheetName, title };
}

export async function appendLeadToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  lead: Omit<ClientLead, 'id' | 'rowIndex'>
): Promise<{ updatedRange: string; rowIndex: number }> {
  const values = [
    [
      lead.timestamp || new Date().toLocaleString(),
      lead.fullName,
      lead.email,
      lead.phone,
      lead.company,
      lead.service,
      lead.budgetNotes,
      lead.status || 'New',
      lead.welcomeEmailSent ? 'TRUE' : 'FALSE',
      lead.welcomeEmailDate || (lead.welcomeEmailSent ? new Date().toLocaleString() : ''),
      lead.notes || '',
    ],
  ];

  const range = `'${sheetName}'!A:K`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to append lead to Sheet: ${await res.text()}`);
  }

  const result = await res.json();
  const updatedRange = result.updates?.updatedRange || '';
  // Extract row index from updated range (e.g. "'Client Leads'!A3:K3" -> 3)
  const match = updatedRange.match(/([0-9]+):[A-Z]*([0-9]+)/);
  const rowIndex = match ? parseInt(match[1], 10) : 2;

  return { updatedRange, rowIndex };
}

export async function updateLeadInSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  updates: {
    status?: ClientLead['status'];
    welcomeEmailSent?: boolean;
    welcomeEmailDate?: string;
    notes?: string;
  }
) {
  // Update status (col H), email sent (col I), email timestamp (col J), notes (col K)
  const range = `'${sheetName}'!H${rowIndex}:K${rowIndex}`;
  const values = [
    [
      updates.status !== undefined ? updates.status : '',
      updates.welcomeEmailSent !== undefined ? (updates.welcomeEmailSent ? 'TRUE' : 'FALSE') : '',
      updates.welcomeEmailDate !== undefined ? updates.welcomeEmailDate : '',
      updates.notes !== undefined ? updates.notes : '',
    ],
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update lead row: ${await res.text()}`);
  }

  return res.json();
}
