import React, { useState } from 'react';
import { EmailTemplate, GoogleSheetConfig, GoogleFormConfig } from '../types';
import { generateAppsScriptCode } from '../services/appsScriptGenerator';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Send,
  ArrowRight,
  Eye,
  Sliders,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface AppsScriptTabProps {
  emailTemplate: EmailTemplate;
  onUpdateTemplate: (template: EmailTemplate) => void;
  sheetConfig: GoogleSheetConfig | null;
  formConfig: GoogleFormConfig | null;
  onTestSendEmail: () => Promise<void>;
  isSendingTest: boolean;
  onAdvanceToTest: () => void;
}

export const AppsScriptTab: React.FC<AppsScriptTabProps> = ({
  emailTemplate,
  onUpdateTemplate,
  sheetConfig,
  formConfig,
  onTestSendEmail,
  isSendingTest,
  onAdvanceToTest,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'template' | 'guide'>('code');

  const scriptCode = generateAppsScriptCode(
    emailTemplate,
    sheetConfig?.spreadsheetId,
    formConfig?.responderUri
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="apps-script-tab" className="space-y-6">
      {/* Bento Stage Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
            03
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                Stage 3 of 4 • Automation Engine
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Google Apps Script: Automated Welcome Email Trigger
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Connects Google Forms directly to Gmail without recurring subscription fees. The moment a client submits the form, Apps Script dispatches a personalized welcome message and alerts <strong className="text-indigo-600 font-semibold">{emailTemplate.ownerEmail}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Bento Sub Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="subtab-code-btn"
            onClick={() => setActiveSubTab('code')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-2xl transition-all border ${
              activeSubTab === 'code'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Generated Code.gs</span>
          </button>

          <button
            id="subtab-template-btn"
            onClick={() => setActiveSubTab('template')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-2xl transition-all border ${
              activeSubTab === 'template'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Email Template</span>
          </button>

          <button
            id="subtab-guide-btn"
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-2xl transition-all border ${
              activeSubTab === 'guide'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Trigger Setup Guide (4 Steps)</span>
          </button>
        </div>

        <button
          id="send-test-welcome-email-btn"
          onClick={onTestSendEmail}
          disabled={isSendingTest}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors shadow-xs disabled:opacity-50"
        >
          {isSendingTest ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending via Gmail API...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send Sample to {emailTemplate.ownerEmail.split('@')[0]}</span>
            </>
          )}
        </button>
      </div>

      {/* Sub Tab: Code View */}
      {activeSubTab === 'code' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-md">
          <div className="p-4 sm:p-5 bg-slate-900 text-slate-300 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/90" />
                <span className="w-3 h-3 rounded-full bg-amber-500/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-200 ml-2">Code.gs — Google Apps Script Engine</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-apps-script-code-btn"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Code!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Full Script</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto max-h-[520px] leading-relaxed">
            <pre>{scriptCode}</pre>
          </div>

          <div className="p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Ready to paste into your Google Spreadsheet under <span className="text-slate-200 font-semibold">Extensions → Apps Script</span>.
            </div>
            <button
              id="advance-to-test-btn"
              onClick={onAdvanceToTest}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
            >
              <span>Continue to Step 4: Test Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sub Tab: Template Customizer */}
      {activeSubTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Editor Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Email Content & Personalization
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dynamic Tokens</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject Line
              </label>
              <input
                id="template-subject-input"
                type="text"
                value={emailTemplate.subject}
                onChange={(e) =>
                  onUpdateTemplate({ ...emailTemplate, subject: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Greeting Line
              </label>
              <input
                id="template-greeting-input"
                type="text"
                value={emailTemplate.greeting}
                onChange={(e) =>
                  onUpdateTemplate({ ...emailTemplate, greeting: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Main Welcome Message Body
              </label>
              <textarea
                id="template-body-input"
                rows={4}
                value={emailTemplate.body}
                onChange={(e) =>
                  onUpdateTemplate({ ...emailTemplate, body: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CTA Button Text (Optional)
                </label>
                <input
                  type="text"
                  value={emailTemplate.ctaText}
                  onChange={(e) =>
                    onUpdateTemplate({ ...emailTemplate, ctaText: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="View Client Portal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CTA URL
                </label>
                <input
                  type="text"
                  value={emailTemplate.ctaUrl}
                  onChange={(e) =>
                    onUpdateTemplate({ ...emailTemplate, ctaUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Signature & Sign-off
              </label>
              <textarea
                rows={2}
                value={emailTemplate.signature}
                onChange={(e) =>
                  onUpdateTemplate({ ...emailTemplate, signature: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800">
                  Notify CRM Owner ({emailTemplate.ownerEmail})
                </label>
                <p className="text-[11px] text-slate-500">
                  Automatically sends a CC copy to you whenever a new client is emailed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailTemplate.sendCopyToOwner}
                onChange={(e) =>
                  onUpdateTemplate({ ...emailTemplate, sendCopyToOwner: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            {/* Token Cheat Sheet */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider">Available Dynamic Tokens:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">{'{{Full Name}}'}</code>
                <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">{'{{First Name}}'}</code>
                <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">{'{{Company}}'}</code>
                <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">{'{{Service}}'}</code>
                <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">{'{{Owner Email}}'}</code>
              </div>
            </div>
          </div>

          {/* Live Email Preview Window in Bento Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-slate-500" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Live Client Inbox Preview
                </h3>
              </div>

              {/* Mock Email Frame */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 text-xs">
                {/* Header */}
                <div className="bg-white p-4 border-b border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-14 text-[11px] uppercase tracking-wider">Subject:</span>
                    <span className="font-bold text-slate-900">
                      {emailTemplate.subject.replace(/{{Full Name}}/g, 'Alex Rivera')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-14 text-[11px] uppercase tracking-wider">To:</span>
                    <span className="text-slate-700 font-medium">alex.rivera@example.com</span>
                  </div>
                  {emailTemplate.sendCopyToOwner && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-14 text-[11px] uppercase tracking-wider">Cc:</span>
                      <span className="text-indigo-600 font-mono text-[10px]">
                        {emailTemplate.ownerEmail}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body Render */}
                <div className="p-5 bg-white m-3 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="bg-indigo-600 text-white p-3 rounded-xl text-sm font-extrabold tracking-tight">
                    Welcome to Our Client Portal
                  </div>

                  <p className="font-bold text-slate-900">
                    {emailTemplate.greeting
                      .replace(/{{First Name}}/g, 'Alex')
                      .replace(/{{Full Name}}/g, 'Alex Rivera')}
                  </p>

                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {emailTemplate.body
                      .replace(/{{Service}}/g, 'Web & App Development')
                      .replace(/{{Company}}/g, 'Rivera Innovations')}
                  </p>

                  <div className="bg-slate-50 border-l-4 border-indigo-600 p-3 rounded-r-xl text-[11px]">
                    <div className="font-bold text-slate-800 uppercase tracking-wider">
                      Inquiry Details
                    </div>
                    <div className="text-slate-600 mt-1">Service: Web & App Development</div>
                    <div className="text-slate-600">Company: Rivera Innovations</div>
                  </div>

                  {emailTemplate.ctaText && emailTemplate.ctaUrl && (
                    <div>
                      <span className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-[11px]">
                        {emailTemplate.ctaText}
                      </span>
                    </div>
                  )}

                  <div className="text-slate-600 pt-3 border-t border-slate-100 whitespace-pre-line text-[11px]">
                    {emailTemplate.signature}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Live preview automatically updates</span>
              <button
                onClick={onTestSendEmail}
                disabled={isSendingTest}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Sample to {emailTemplate.ownerEmail.split('@')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Setup Guide in Bento Styling */}
      {activeSubTab === 'guide' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                How to activate the Apps Script trigger in Google Sheets
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Takes less than 60 seconds. Once activated, Google handles all incoming triggers in the cloud 24/7.
              </p>
            </div>

            {sheetConfig && (
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Google Sheet</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Step 1 */}
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                01
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Open Apps Script Editor in Sheet
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In your Google Sheet, click <strong className="text-slate-800">Extensions</strong> in the top menu bar, then click <strong className="text-slate-800">Apps Script</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                02
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Paste & Save Code.gs
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Copy the code from the <strong className="text-slate-800">Generated Code.gs</strong> tab, paste it over any sample code in the editor, and click the <strong className="text-slate-800">Save (💾)</strong> icon.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                03
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Add Form Submit Trigger
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In the Apps Script left navigation, click the <strong className="text-slate-800">Triggers (⏰)</strong> icon. Click <strong className="text-slate-800">+ Add Trigger</strong> at the bottom right.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                04
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select Event Source: "On Form Submit"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Set function to <code className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold">onFormSubmitTrigger</code>, event source to <strong className="text-slate-800">From spreadsheet</strong>, and event type to <strong className="text-slate-800">On form submit</strong>. Click Save & Authorize.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Once configured, new form entries will trigger immediate welcome emails!</span>
            </div>
            <button
              onClick={onAdvanceToTest}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
            >
              <span>Test Automation Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
