export interface ClientLead {
  id: string;
  rowIndex?: number;
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budgetNotes: string;
  status: 'New' | 'Contacted' | 'In Discussion' | 'Proposal Sent' | 'Converted' | 'Closed';
  welcomeEmailSent: boolean;
  welcomeEmailDate?: string;
  notes?: string;
}

export interface FormField {
  id: string;
  title: string;
  type: 'TEXT' | 'PARAGRAPH_TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'SCALE';
  required: boolean;
  options?: string[];
  description?: string;
}

export interface GoogleFormConfig {
  formId: string;
  responderUri: string;
  editUri: string;
  title: string;
  description: string;
  fields: FormField[];
  connectedSheetId?: string;
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetName: string;
  lastSynced?: string;
  rowCount: number;
}

export interface EmailTemplate {
  subject: string;
  greeting: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  signature: string;
  ownerEmail: string;
  sendCopyToOwner: boolean;
}

export interface TestRunResult {
  step: 'form' | 'sheet' | 'script' | 'gmail';
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  message: string;
  details?: any;
  timestamp: string;
}
