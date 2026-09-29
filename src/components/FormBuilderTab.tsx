import React, { useState } from 'react';
import { GoogleFormConfig } from '../types';
import {
  FileText,
  ExternalLink,
  PlusCircle,
  CheckCircle,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Send,
} from 'lucide-react';

interface FormBuilderTabProps {
  formConfig: GoogleFormConfig | null;
  onCreateForm: (title: string, description: string) => Promise<void>;
  isLoading: boolean;
  onAdvanceToSheet: () => void;
  onSimulateIntake: (leadData: any) => Promise<void>;
}

export const FormBuilderTab: React.FC<FormBuilderTabProps> = ({
  formConfig,
  onCreateForm,
  isLoading,
  onAdvanceToSheet,
  onSimulateIntake,
}) => {
  const [formTitle, setFormTitle] = useState('Client Intake & Lead Capture Form');
  const [formDesc, setFormDesc] = useState(
    'Please share your project details to get started. Our CRM automatically registers your inquiry in our central spreadsheet and sends an instant welcome packet.'
  );
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick In-App Form Submission Test State
  const [testName, setTestName] = useState('Sarah Jenkins');
  const [testEmail, setTestEmail] = useState('kerissanaicker1@gmail.com');
  const [testPhone, setTestPhone] = useState('+1 (555) 234-8901');
  const [testCompany, setTestCompany] = useState('Apex Technologies');
  const [testService, setTestService] = useState('Web & App Development');
  const [testBudget, setTestBudget] = useState('$5,000 - $10,000 (Q3 Launch)');
  const [submittingTest, setSubmittingTest] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleCopyLink = () => {
    if (formConfig?.responderUri) {
      navigator.clipboard.writeText(formConfig.responderUri);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setSubmittingTest(true);
    setSubmissionSuccess(false);
    try {
      await onSimulateIntake({
        fullName: testName,
        email: testEmail,
        phone: testPhone,
        company: testCompany,
        service: testService,
        budgetNotes: testBudget,
      });
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 4000);
    } catch (err) {
      console.error('Quick submit error:', err);
    } finally {
      setSubmittingTest(false);
    }
  };

  return (
    <div id="form-builder-tab" className="space-y-6">
      {/* Bento Stage Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
            01
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                Stage 1 of 4 • Client Ingestion
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Google Form: Client Intake Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              The front door of your CRM. Prospective clients fill out this form with their contact details, company information, and requested service. Submissions automatically stream downstream into Google Sheets.
            </p>
          </div>
        </div>
      </div>

      {!formConfig ? (
        /* Create Form Card in Bento Style */
        <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Provision Google Form in your Drive
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-2xl">
            Click below to generate a standardized CRM intake form in your Google Account with all required intake fields (Name, Email, Phone, Company, Service, Budget) pre-configured.
          </p>

          <div className="space-y-5 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Form Title
              </label>
              <input
                id="create-form-title-input"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Form Description
              </label>
              <textarea
                id="create-form-desc-input"
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              id="provision-google-form-btn"
              type="button"
              disabled={isLoading}
              onClick={() => onCreateForm(formTitle, formDesc)}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Form via Google API...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Google Intake Form</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Form Created Bento Grid Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Form Live Card & Field Schema */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Form Live in Drive
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    {formConfig.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {formConfig.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-5 border-t border-slate-100">
                <a
                  id="open-live-form-btn"
                  href={formConfig.responderUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Public Form</span>
                </a>

                <a
                  id="edit-google-form-btn"
                  href={formConfig.editUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit in Google Forms</span>
                </a>

                <button
                  id="copy-form-url-btn"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Share Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form Fields Breakdown in Bento Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Intake Schema & Field Mapping (6 Fields)
                </h4>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Spreadsheet Column Bindings
                </span>
              </div>

              <div className="space-y-3">
                {formConfig.fields.map((field, i) => (
                  <div
                    key={field.id}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {i + 1}. {field.title}
                        </span>
                        {field.required && (
                          <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                            Required
                          </span>
                        )}
                        <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          {field.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                      {field.options && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {field.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="text-[11px] bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg text-slate-600 font-medium"
                            >
                              • {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                      Col {String.fromCharCode(66 + i)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Next Step Banner */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-500">
                  Step 1 Complete • Intake form is configured and ready
                </div>
                <button
                  id="advance-to-sheet-btn"
                  onClick={onAdvanceToSheet}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
                >
                  <span>Continue to Step 2: Google Sheets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Bento Lead Simulator */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Send className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Instant Client Intake Simulator
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Submit a new client lead right now from this dashboard to test live sync to your Google Sheet!
              </p>

              <form onSubmit={handleQuickSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={testCompany}
                    onChange={(e) => setTestCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Service Interested In *
                  </label>
                  <select
                    value={testService}
                    onChange={(e) => setTestService(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
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
                    Budget / Scope Notes
                  </label>
                  <textarea
                    rows={2}
                    value={testBudget}
                    onChange={(e) => setTestBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  id="submit-simulated-lead-btn"
                  type="submit"
                  disabled={submittingTest}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submittingTest ? (
                    <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording to CRM...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Client Details</span>
                    </>
                  )}
                </button>
              </form>

              {submissionSuccess && (
                <div className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Lead recorded! Check the Google Sheet tab.</span>
                </div>
              )}
            </div>

            {/* How Google Connects Bento Card */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 text-xs text-slate-600 space-y-2.5">
              <h5 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                How the connection works
              </h5>
              <p className="leading-relaxed">
                1. <strong>Google Form</strong> collects client inquiries via the public URL.
              </p>
              <p className="leading-relaxed">
                2. <strong>Google Sheet</strong> stores each response as an immutable, timestamped record.
              </p>
              <p className="leading-relaxed">
                3. <strong>Google Apps Script</strong> listens to new rows and triggers an instant welcome email.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
