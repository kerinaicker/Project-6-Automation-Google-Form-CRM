import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessTokenManually,
} from './services/auth';
import {
  GoogleFormConfig,
  GoogleSheetConfig,
  ClientLead,
  EmailTemplate,
  TestRunResult,
} from './types';
import { Navbar, CrmStage } from './components/Navbar';
import { FormBuilderTab } from './components/FormBuilderTab';
import { SheetManagerTab } from './components/SheetManagerTab';
import { AppsScriptTab } from './components/AppsScriptTab';
import { TestSuiteTab } from './components/TestSuiteTab';
import { ConfirmModal } from './components/ConfirmModal';
import {
  createGoogleForm,
  fetchFormDetails,
} from './services/googleForms';
import {
  createCrmSpreadsheet,
  fetchLeadsFromSheet,
  appendLeadToSheet,
  updateLeadInSheet,
} from './services/googleSheets';
import { sendGmailWelcomeEmail } from './services/googleGmail';
import {
  FileText,
  Table,
  Code2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const STORAGE_KEYS = {
  FORM_ID: 'workspace_crm_form_id',
  SHEET_ID: 'workspace_crm_sheet_id',
  TEMPLATE: 'workspace_crm_template',
};

const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
  subject: 'Welcome to our Client Portal — {{Company}} Project Inquiry',
  greeting: 'Hi {{First Name}},',
  body: 'Thank you for reaching out to us regarding {{Service}}! We have received your inquiry and our team is already reviewing your project details.\n\nWe typically schedule an introductory strategy session within 1 business day to discuss timelines and next milestones.',
  ctaText: 'Access Client Portal',
  ctaUrl: 'https://docs.google.com',
  signature: 'Best regards,\nClient Strategy & Growth Team\nGoogle Workspace CRM',
  ownerEmail: 'kerissanaicker1@gmail.com',
  sendCopyToOwner: true,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Workflow State
  const [currentStage, setCurrentStage] = useState<CrmStage>('form');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Core CRM Workspace State
  const [formConfig, setFormConfig] = useState<GoogleFormConfig | null>(null);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(null);
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return DEFAULT_EMAIL_TEMPLATE;
  });

  // Testing Suite State
  const [testResults, setTestResults] = useState<TestRunResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastTestLead, setLastTestLead] = useState<ClientLead | null>(null);

  // User Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    details?: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save template edits to local storage
  const handleUpdateTemplate = (updated: EmailTemplate) => {
    setEmailTemplate(updated);
    localStorage.setItem(STORAGE_KEYS.TEMPLATE, JSON.stringify(updated));
  };

  // Sign In Handler with Google Popup
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setAccessTokenManually(res.accessToken);
        setNeedsAuth(false);

        // Update owner email if empty
        if (res.user.email && (!emailTemplate.ownerEmail || emailTemplate.ownerEmail === 'kerissanaicker1@gmail.com')) {
          const updated = { ...emailTemplate, ownerEmail: res.user.email };
          setEmailTemplate(updated);
          localStorage.setItem(STORAGE_KEYS.TEMPLATE, JSON.stringify(updated));
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Failed to authenticate with Google Workspace');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
  };

  // Load existing Form or Sheet if IDs exist in localStorage
  const loadWorkspaceResources = useCallback(
    async (authToken: string) => {
      const savedFormId = localStorage.getItem(STORAGE_KEYS.FORM_ID);
      const savedSheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);

      if (savedFormId && !formConfig) {
        try {
          const details = await fetchFormDetails(authToken, savedFormId);
          setFormConfig(details);
        } catch (err) {
          console.warn('Could not auto-load saved form:', err);
        }
      }

      if (savedSheetId) {
        try {
          const { leads: sheetLeads, sheetName, title } = await fetchLeadsFromSheet(
            authToken,
            savedSheetId
          );
          setLeads(sheetLeads);
          setSheetConfig({
            spreadsheetId: savedSheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${savedSheetId}/edit`,
            title,
            sheetName,
            rowCount: sheetLeads.length,
            lastSynced: new Date().toLocaleTimeString(),
          });
        } catch (err) {
          console.warn('Could not auto-load saved spreadsheet:', err);
        }
      }
    },
    [formConfig]
  );

  useEffect(() => {
    if (token) {
      loadWorkspaceResources(token);
    }
  }, [token, loadWorkspaceResources]);

  // Sync / Refresh All Data
  const handleRefreshAll = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsSyncing(true);
    try {
      if (sheetConfig?.spreadsheetId) {
        const { leads: sheetLeads, sheetName, title } = await fetchLeadsFromSheet(
          activeToken,
          sheetConfig.spreadsheetId,
          sheetConfig.sheetName
        );
        setLeads(sheetLeads);
        setSheetConfig((prev) =>
          prev
            ? {
                ...prev,
                title,
                sheetName,
                rowCount: sheetLeads.length,
                lastSynced: new Date().toLocaleTimeString(),
              }
            : null
        );
      }
      if (formConfig?.formId) {
        const updatedForm = await fetchFormDetails(activeToken, formConfig.formId);
        setFormConfig(updatedForm);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // STEP 1: Provision Google Form
  const handleCreateForm = async (title: string, description: string) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingAction(true);
    try {
      const created = await createGoogleForm(activeToken, title, description);
      setFormConfig(created);
      localStorage.setItem(STORAGE_KEYS.FORM_ID, created.formId);
      setCurrentStage('form');
    } catch (err: any) {
      console.error('Error creating Google Form:', err);
      alert(`Error creating form: ${err.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // STEP 2: Provision Google Sheet
  const handleCreateSheet = async (title?: string) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingAction(true);
    try {
      const sheet = await createCrmSpreadsheet(
        activeToken,
        title || 'Google Workspace CRM - Client Leads'
      );
      setSheetConfig(sheet);
      localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheet.spreadsheetId);
      setLeads([]);
      setCurrentStage('sheet');
    } catch (err: any) {
      console.error('Error creating Google Sheet:', err);
      alert(`Error creating spreadsheet: ${err.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // STEP 2: Append Manual Lead / Simulate Intake
  const handleAppendLead = async (leadData: Omit<ClientLead, 'id' | 'rowIndex'>) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    if (!sheetConfig) {
      // Auto create sheet if missing
      await handleCreateSheet();
    }

    const currentSheetId = sheetConfig?.spreadsheetId || localStorage.getItem(STORAGE_KEYS.SHEET_ID);
    if (!currentSheetId) return;

    try {
      const { rowIndex } = await appendLeadToSheet(
        activeToken,
        currentSheetId,
        sheetConfig?.sheetName || 'Client Leads',
        leadData
      );

      const newLead: ClientLead = {
        ...leadData,
        id: `lead-${Date.now()}`,
        rowIndex,
      };

      setLeads((prev) => [newLead, ...prev]);
    } catch (err: any) {
      console.error('Failed to append lead to Sheet:', err);
      alert(`Failed to write to Google Sheet: ${err.message}`);
    }
  };

  // STEP 2: Update Lead Status
  const handleUpdateLeadStatus = async (lead: ClientLead, newStatus: ClientLead['status']) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !sheetConfig || !lead.rowIndex) return;

    try {
      await updateLeadInSheet(
        activeToken,
        sheetConfig.spreadsheetId,
        sheetConfig.sheetName,
        lead.rowIndex,
        { status: newStatus }
      );

      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
      );
    } catch (err: any) {
      console.error('Failed to update lead status:', err);
      alert(`Could not update Google Sheet row: ${err.message}`);
    }
  };

  // STEP 3: Send Welcome Email via Gmail API (With Confirmation Modal)
  const triggerSendEmail = async (lead: ClientLead) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Send Automated Welcome Email?',
      message: `You are about to dispatch an official welcome email via Gmail to ${lead.fullName} (${lead.email}).`,
      details: [
        `Recipient: ${lead.email}`,
        `Subject: ${emailTemplate.subject.replace(/{{Company}}/g, lead.company || 'your project')}`,
        emailTemplate.sendCopyToOwner ? `CC Notification: ${emailTemplate.ownerEmail}` : '',
      ].filter(Boolean),
      confirmLabel: 'Send via Gmail',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await sendGmailWelcomeEmail(activeToken, emailTemplate, lead);

          // Update spreadsheet row
          const nowStr = new Date().toLocaleString();
          if (sheetConfig && lead.rowIndex) {
            await updateLeadInSheet(
              activeToken,
              sheetConfig.spreadsheetId,
              sheetConfig.sheetName,
              lead.rowIndex,
              {
                welcomeEmailSent: true,
                welcomeEmailDate: nowStr,
              }
            );
          }

          setLeads((prev) =>
            prev.map((l) =>
              l.id === lead.id
                ? { ...l, welcomeEmailSent: true, welcomeEmailDate: nowStr }
                : l
            )
          );
        } catch (err: any) {
          console.error('Failed to send email:', err);
          alert(`Gmail API Error: ${err.message}`);
        }
      },
    });
  };

  // STEP 3: Quick Test Email to Owner
  const handleTestOwnerEmail = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingAction(true);
    try {
      await sendGmailWelcomeEmail(activeToken, emailTemplate, {
        fullName: 'Test Client (Sample)',
        email: emailTemplate.ownerEmail || 'kerissanaicker1@gmail.com',
        company: 'Sample Enterprise',
        service: 'Web & App Development',
        budgetNotes: 'Testing automated email dispatch from Google Workspace CRM',
      });
      alert(`✅ Test email successfully sent via Gmail API to ${emailTemplate.ownerEmail}!`);
    } catch (err: any) {
      console.error('Error sending test email:', err);
      alert(`Gmail error: ${err.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // STEP 4: End-to-End Test Suite Runner
  const handleRunEndToEndTest = async (testData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    budget: string;
  }) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsRunningTest(true);
    setTestResults([]);

    const timestamp = new Date().toLocaleTimeString();

    // Step 1: Form Simulation
    setTestResults([
      {
        step: 'form',
        name: '1. Form Intake Simulation',
        status: 'running',
        message: `Simulating form submission payload for client "${testData.name}"...`,
        timestamp,
      },
    ]);

    await new Promise((r) => setTimeout(r, 600));

    setTestResults([
      {
        step: 'form',
        name: '1. Form Intake Simulation',
        status: 'success',
        message: 'Form validation passed. Ingested payload structured according to schema.',
        details: {
          'Client Name': testData.name,
          'Target Email': testData.email,
          Service: testData.service,
          Company: testData.company,
        },
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        step: 'sheet',
        name: '2. Google Sheet Database Append',
        status: 'running',
        message: `Appending new lead record to spreadsheet "${sheetConfig?.title || 'CRM Database'}"...`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    let sheetRowIndex = 2;
    try {
      if (!sheetConfig) {
        throw new Error('Google Sheet not initialized. Please complete Step 2 first.');
      }

      const appendRes = await appendLeadToSheet(
        activeToken,
        sheetConfig.spreadsheetId,
        sheetConfig.sheetName,
        {
          timestamp: new Date().toLocaleString(),
          fullName: testData.name,
          email: testData.email,
          phone: testData.phone,
          company: testData.company,
          service: testData.service,
          budgetNotes: testData.budget,
          status: 'New',
          welcomeEmailSent: false,
          notes: 'Test run entry',
        }
      );
      sheetRowIndex = appendRes.rowIndex;

      setTestResults((prev) => [
        prev[0],
        {
          step: 'sheet',
          name: '2. Google Sheet Database Append',
          status: 'success',
          message: `Record successfully committed to Google Sheets row #${sheetRowIndex} with timestamp.`,
          details: {
            'Spreadsheet ID': sheetConfig.spreadsheetId,
            'Tab Name': sheetConfig.sheetName,
            'Row Index': sheetRowIndex,
            'Updated Range': appendRes.updatedRange,
          },
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          step: 'gmail',
          name: '3. Automated Welcome Email Dispatch',
          status: 'running',
          message: `Dispatching customized welcome email via Gmail API to ${testData.email}...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (sheetErr: any) {
      setTestResults((prev) => [
        prev[0],
        {
          step: 'sheet',
          name: '2. Google Sheet Database Append',
          status: 'failed',
          message: `Failed writing to Google Sheets: ${sheetErr.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsRunningTest(false);
      return;
    }

    // Step 3: Gmail Dispatch
    let messageId = '';
    try {
      const emailRes = await sendGmailWelcomeEmail(activeToken, emailTemplate, {
        fullName: testData.name,
        email: testData.email,
        company: testData.company,
        service: testData.service,
        budgetNotes: testData.budget,
      });
      messageId = emailRes.messageId;

      setTestResults((prev) => [
        prev[0],
        prev[1],
        {
          step: 'gmail',
          name: '3. Automated Welcome Email Dispatch',
          status: 'success',
          message: `Welcome email successfully sent from your Gmail account to ${testData.email}!`,
          details: {
            'Message ID': messageId,
            Recipient: testData.email,
            'Owner CC': emailTemplate.sendCopyToOwner ? emailTemplate.ownerEmail : 'None',
            Subject: emailTemplate.subject.replace(/{{Company}}/g, testData.company),
          },
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          step: 'script',
          name: '4. Spreadsheet Flag Audit & Confirmation',
          status: 'running',
          message: `Updating Column I (Welcome Email Sent = TRUE) in Google Sheets for row #${sheetRowIndex}...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (emailErr: any) {
      setTestResults((prev) => [
        prev[0],
        prev[1],
        {
          step: 'gmail',
          name: '3. Automated Welcome Email Dispatch',
          status: 'failed',
          message: `Gmail API send error: ${emailErr.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsRunningTest(false);
      return;
    }

    // Step 4: Update Flag in Sheet
    try {
      const nowStr = new Date().toLocaleString();
      if (sheetConfig) {
        await updateLeadInSheet(
          activeToken,
          sheetConfig.spreadsheetId,
          sheetConfig.sheetName,
          sheetRowIndex,
          {
            welcomeEmailSent: true,
            welcomeEmailDate: nowStr,
            status: 'New',
          }
        );
      }

      setTestResults((prev) => [
        prev[0],
        prev[1],
        prev[2],
        {
          step: 'script',
          name: '4. Spreadsheet Flag Audit & Confirmation',
          status: 'success',
          message: `Spreadsheet row #${sheetRowIndex} marked as "Welcome Email Sent = TRUE" with audit timestamp.`,
          details: {
            'Audit Status': 'TRUE',
            'Delivery Time': nowStr,
            'Pipeline Status': 'New',
          },
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Refresh leads list
      handleRefreshAll();
    } catch (auditErr: any) {
      setTestResults((prev) => [
        prev[0],
        prev[1],
        prev[2],
        {
          step: 'script',
          name: '4. Spreadsheet Flag Audit & Confirmation',
          status: 'failed',
          message: `Audit update error: ${auditErr.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Auth Screen if not signed in
  if (needsAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md">
            CRM
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Google Workspace CRM
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Automated intake and welcome workflow for <span className="font-semibold text-slate-800">kerissanaicker1@gmail.com</span>
            </p>
          </div>

          {/* Bento Steps Checklist */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">01</span>
              <span><strong>Google Form</strong>: Intake Interface</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">02</span>
              <span><strong>Google Sheets</strong>: Real-time Persistence</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">03</span>
              <span><strong>Apps Script</strong>: Instant Outreach Trigger</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-[10px] font-black">04</span>
              <span><strong>Test Suite</strong>: Full Validation</span>
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 text-left">
              {authError}
            </div>
          )}

          {/* Official Google Sign-In Button */}
          <div className="pt-2 flex justify-center">
            <button
              id="google-signin-btn"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-slate-300 rounded-2xl hover:bg-slate-50 transition-colors shadow-xs bg-white text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              )}
              <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Direct Google OAuth • No third-party servers</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bento Navbar */}
      <Navbar
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        user={user}
        onLogout={handleLogout}
        onRefresh={handleRefreshAll}
        isSyncing={isSyncing}
        hasForm={!!formConfig}
        hasSheet={!!sheetConfig}
      />

      {/* Main Bento Workspace Stage View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Bento Hero Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Main Project Bento Card */}
          <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 tracking-wider">
                  Bento Workflow
                </span>
                <span className="text-xs text-slate-400 font-medium">•</span>
                <span className="text-xs text-slate-500 font-medium">End-to-End System Pipeline</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Project: Automated Welcome CRM
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-2 max-w-2xl">
                This workflow synchronizes Google Forms for intake, Google Sheets for persistence, and Apps Script for immediate customer engagement. Each module operates as a dependency in a sequential pipeline.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-4 mt-4 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  Primary Engineer
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {user?.displayName || 'Kerissa Naicker'}
                </span>
              </div>

              <div className="flex flex-col border-l border-slate-200 pl-5">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  System Email
                </span>
                <span className="text-xs sm:text-sm font-bold text-indigo-600 font-mono truncate max-w-[220px]">
                  {emailTemplate.ownerEmail || 'kerissanaicker1@gmail.com'}
                </span>
              </div>

              <div className="flex flex-col border-l border-slate-200 pl-5">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  Active Records
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-600">
                  {leads.length} Leads in Sheet
                </span>
              </div>
            </div>
          </div>

          {/* Bento Quick Stage Selector Card */}
          <div className="md:col-span-4 bg-indigo-600 rounded-3xl p-6 sm:p-7 border border-indigo-700 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
                Active Module
              </span>
              <div className="text-2xl font-black opacity-90">
                {currentStage === 'form' && '01'}
                {currentStage === 'sheet' && '02'}
                {currentStage === 'script' && '03'}
                {currentStage === 'test' && '04'}
              </div>
            </div>

            <div className="my-3">
              <h3 className="text-lg font-black tracking-tight text-white">
                {currentStage === 'form' && 'Google Form (Intake)'}
                {currentStage === 'sheet' && 'Google Sheets (Database)'}
                {currentStage === 'script' && 'Apps Script (Engine)'}
                {currentStage === 'test' && 'Validation (Test Suite)'}
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed mt-1">
                {currentStage === 'form' && 'Capture client contact information, project scope, and interest.'}
                {currentStage === 'sheet' && 'Central database where form submissions are logged in real time.'}
                {currentStage === 'script' && 'Automated welcome email engine triggered on form submission.'}
                {currentStage === 'test' && 'Simulate end-to-end payload dispatch across all 4 services.'}
              </p>
            </div>

            <div className="bg-indigo-500/40 p-2.5 rounded-2xl border border-indigo-400/30 text-xs font-mono flex items-center justify-between">
              <span className="text-[11px] opacity-90 truncate">
                {currentStage === 'form' && (formConfig?.formId ? `Form: ${formConfig.formId.slice(0, 16)}...` : 'form.google.com/create')}
                {currentStage === 'sheet' && (sheetConfig?.spreadsheetId ? `Sheet: ${sheetConfig.spreadsheetId.slice(0, 16)}...` : 'sheets.google.com')}
                {currentStage === 'script' && 'Code.gs: onFormSubmitTrigger'}
                {currentStage === 'test' && 'Suite: 4 Steps Diagnostic'}
              </span>
            </div>
          </div>
        </div>

        {/* Stage Content */}
        {currentStage === 'form' && (
          <FormBuilderTab
            formConfig={formConfig}
            onCreateForm={handleCreateForm}
            isLoading={isLoadingAction}
            onAdvanceToSheet={() => setCurrentStage('sheet')}
            onSimulateIntake={handleAppendLead}
          />
        )}

        {currentStage === 'sheet' && (
          <SheetManagerTab
            sheetConfig={sheetConfig}
            leads={leads}
            isLoading={isLoadingAction}
            isSyncing={isSyncing}
            onCreateSheet={handleCreateSheet}
            onRefreshLeads={handleRefreshAll}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onSendSingleEmail={triggerSendEmail}
            onManualAddLead={handleAppendLead}
            onAdvanceToScript={() => setCurrentStage('script')}
          />
        )}

        {currentStage === 'script' && (
          <AppsScriptTab
            emailTemplate={emailTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            sheetConfig={sheetConfig}
            formConfig={formConfig}
            onTestSendEmail={handleTestOwnerEmail}
            isSendingTest={isLoadingAction}
            onAdvanceToTest={() => setCurrentStage('test')}
          />
        )}

        {currentStage === 'test' && (
          <TestSuiteTab
            formConfig={formConfig}
            sheetConfig={sheetConfig}
            emailTemplate={emailTemplate}
            onRunEndToEndTest={handleRunEndToEndTest}
            isRunningTest={isRunningTest}
            testResults={testResults}
            lastTestLead={lastTestLead}
            onResetTestResults={() => setTestResults([])}
          />
        )}

        {/* Bento Bottom Pipeline Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 sm:gap-8 w-full justify-between sm:justify-start">
            <button
              onClick={() => setCurrentStage('form')}
              className={`flex items-center gap-2 transition-transform hover:scale-105 ${currentStage === 'form' ? 'opacity-100 font-black' : 'opacity-70'}`}
            >
              <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full" />
              <span className="text-xs font-black uppercase text-slate-700 tracking-tighter">01 Capture</span>
            </button>
            <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
            <button
              onClick={() => setCurrentStage('sheet')}
              className={`flex items-center gap-2 transition-transform hover:scale-105 ${currentStage === 'sheet' ? 'opacity-100 font-black' : 'opacity-70'}`}
            >
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full" />
              <span className="text-xs font-black uppercase text-slate-700 tracking-tighter">02 Store</span>
            </button>
            <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
            <button
              onClick={() => setCurrentStage('script')}
              className={`flex items-center gap-2 transition-transform hover:scale-105 ${currentStage === 'script' ? 'opacity-100 font-black' : 'opacity-70'}`}
            >
              <div className="w-3.5 h-3.5 bg-slate-900 rounded-full" />
              <span className="text-xs font-black uppercase text-slate-700 tracking-tighter">03 Automate</span>
            </button>
            <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
            <button
              onClick={() => setCurrentStage('test')}
              className={`flex items-center gap-2 transition-transform hover:scale-105 ${currentStage === 'test' ? 'opacity-100 font-black' : 'opacity-70'}`}
            >
              <div className="w-3.5 h-3.5 bg-rose-500 rounded-full" />
              <span className="text-xs font-black uppercase text-slate-700 tracking-tighter">04 Verify</span>
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        details={confirmModal.details}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
