import React, { useState } from 'react';
import {
  TestRunResult,
  GoogleFormConfig,
  GoogleSheetConfig,
  EmailTemplate,
  ClientLead,
} from '../types';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Mail,
  Table,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react';

interface TestSuiteTabProps {
  formConfig: GoogleFormConfig | null;
  sheetConfig: GoogleSheetConfig | null;
  emailTemplate: EmailTemplate;
  onRunEndToEndTest: (testData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    budget: string;
  }) => Promise<void>;
  isRunningTest: boolean;
  testResults: TestRunResult[];
  lastTestLead: ClientLead | null;
  onResetTestResults: () => void;
}

export const TestSuiteTab: React.FC<TestSuiteTabProps> = ({
  formConfig,
  sheetConfig,
  emailTemplate,
  onRunEndToEndTest,
  isRunningTest,
  testResults,
  onResetTestResults,
}) => {
  // Test Lead Form input states
  const [testName, setTestName] = useState('Jordan Lee (Test Lead)');
  const [testEmail, setTestEmail] = useState(
    emailTemplate.ownerEmail || 'kerissanaicker1@gmail.com'
  );
  const [testPhone, setTestPhone] = useState('+1 (555) 349-9921');
  const [testCompany, setTestCompany] = useState('Horizon Global Ventures');
  const [testService, setTestService] = useState('Web & App Development');
  const [testBudget, setTestBudget] = useState('Test project budget $12,000');

  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    onRunEndToEndTest({
      name: testName,
      email: testEmail,
      phone: testPhone,
      company: testCompany,
      service: testService,
      budget: testBudget,
    });
  };

  const getStatusIcon = (status: TestRunResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-slate-300 shrink-0" />;
    }
  };

  const isReady = !!formConfig && !!sheetConfig;

  return (
    <div id="test-suite-tab" className="space-y-6">
      {/* Bento Stage Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
            04
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                Stage 4 of 4 • Full System Verification
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              End-to-End Automation Diagnostic Suite
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Validates the live production flow: <strong>Form Submission → Google Sheet Database Row Appended → Welcome Email Dispatched → CRM Pipeline Status Verified</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites Bento Row */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3.5">
          Workspace Integration Status
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Form Status */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
              formConfig
                ? 'bg-blue-50/50 border-blue-200 text-blue-900'
                : 'bg-amber-50/50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold">1. Google Form</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-blue-100">
              {formConfig ? 'Configured' : 'Pending Step 1'}
            </span>
          </div>

          {/* Sheet Status */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
              sheetConfig
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Table className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold">2. Google Sheet</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-emerald-100">
              {sheetConfig ? 'Connected' : 'Pending Step 2'}
            </span>
          </div>

          {/* Script / Email Status */}
          <div className="p-4 rounded-2xl border bg-indigo-50/50 border-indigo-200 text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold">3. Gmail Dispatch</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-indigo-100 truncate max-w-[120px]" title={emailTemplate.ownerEmail}>
              {emailTemplate.ownerEmail.split('@')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Test Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Configuration Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Play className="w-4 h-4 text-rose-600 fill-rose-600" />
              Simulate Client Submission
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure parameters for the automated simulation. The welcome email will be delivered to the target address below.
            </p>
          </div>

          <form onSubmit={handleStartTest} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Name
              </label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Email (Target for Welcome Message)
              </label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: Your email ({emailTemplate.ownerEmail})
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={testCompany}
                onChange={(e) => setTestCompany(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Interested Service
              </label>
              <select
                value={testService}
                onChange={(e) => setTestService(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
              >
                <option value="Web & App Development">Web & App Development</option>
                <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                <option value="Brand Identity & UI/UX Design">Brand Identity & UI/UX Design</option>
                <option value="Consulting & Strategy">Consulting & Strategy</option>
                <option value="Other Custom Solution">Other Custom Solution</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Notes
              </label>
              <input
                type="text"
                value={testBudget}
                onChange={(e) => setTestBudget(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <button
              id="run-end-to-end-test-btn"
              type="submit"
              disabled={isRunningTest || !isReady}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-4"
            >
              {isRunningTest ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing Pipeline Test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Full End-to-End Test</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Real-Time Diagnostic Execution Log */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Pipeline Execution Log
                </h3>
                <p className="text-xs text-slate-500">
                  Step-by-step diagnostic verification
                </p>
              </div>

              {testResults.length > 0 && (
                <button
                  onClick={onResetTestResults}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 underline"
                >
                  Clear Results
                </button>
              )}
            </div>

            {testResults.length === 0 ? (
              <div className="py-14 text-center text-slate-400 space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Ready for simulation test
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Click "Execute Full End-to-End Test" to verify Form intake, Google Sheet database row insertion, and automated Gmail welcome dispatch.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs flex items-start gap-3.5 transition-all ${
                      res.status === 'success'
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                        : res.status === 'failed'
                        ? 'bg-rose-50/40 border-rose-200 text-slate-800'
                        : 'bg-blue-50/40 border-blue-200 text-slate-800'
                    }`}
                  >
                    <div className="mt-0.5">{getStatusIcon(res.status)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{res.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {res.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {res.message}
                      </p>

                      {res.details && (
                        <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-slate-200/80 font-mono text-[10px] text-slate-700 space-y-1">
                          {Object.entries(res.details).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="text-slate-400">{k}:</span>
                              <span className="font-bold text-slate-800 truncate max-w-[220px]">
                                {String(v)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Success Summary Bento Card */}
            {testResults.length > 0 &&
              testResults.every((r) => r.status === 'success') && (
                <div className="mt-5 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      All 4 Stages Verified & Fully Operational!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      The Google Form intake, Google Sheets row storage, and Gmail welcome message automation are fully connected and verified.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {sheetConfig && (
                        <a
                          href={sheetConfig.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/50 shadow-xs transition-colors"
                        >
                          <Table className="w-3 h-3 text-emerald-600" />
                          <span>View Lead in Google Sheets</span>
                          <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
