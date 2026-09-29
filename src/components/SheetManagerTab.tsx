import React, { useState } from 'react';
import { ClientLead, GoogleSheetConfig } from '../types';
import {
  Table,
  ExternalLink,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  Building,
  Briefcase,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface SheetManagerTabProps {
  sheetConfig: GoogleSheetConfig | null;
  leads: ClientLead[];
  isLoading: boolean;
  isSyncing: boolean;
  onCreateSheet: (title?: string) => Promise<void>;
  onRefreshLeads: () => Promise<void>;
  onUpdateLeadStatus: (lead: ClientLead, newStatus: ClientLead['status']) => Promise<void>;
  onSendSingleEmail: (lead: ClientLead) => Promise<void>;
  onManualAddLead: (leadData: Omit<ClientLead, 'id' | 'rowIndex'>) => Promise<void>;
  onAdvanceToScript: () => void;
}

export const SheetManagerTab: React.FC<SheetManagerTabProps> = ({
  sheetConfig,
  leads,
  isLoading,
  isSyncing,
  onCreateSheet,
  onRefreshLeads,
  onUpdateLeadStatus,
  onSendSingleEmail,
  onManualAddLead,
  onAdvanceToScript,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [emailFilter, setEmailFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lead Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newService, setNewService] = useState('Web & App Development');
  const [newBudget, setNewBudget] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchesEmail =
      emailFilter === 'ALL' ||
      (emailFilter === 'SENT' && lead.welcomeEmailSent) ||
      (emailFilter === 'PENDING' && !lead.welcomeEmailSent);

    return matchesSearch && matchesStatus && matchesEmail;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const emailsSent = leads.filter((l) => l.welcomeEmailSent).length;
  const convertedLeads = leads.filter((l) => l.status === 'Converted').length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;

    setIsSubmittingNew(true);
    try {
      await onManualAddLead({
        timestamp: new Date().toLocaleString(),
        fullName: newFullName,
        email: newEmail,
        phone: newPhone,
        company: newCompany,
        service: newService,
        budgetNotes: newBudget,
        status: 'New',
        welcomeEmailSent: false,
        notes: newNotes,
      });

      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewCompany('');
      setNewBudget('');
      setNewNotes('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add manual lead:', err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const getStatusBadge = (status: ClientLead['status']) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Discussion':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Proposal Sent':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="sheet-manager-tab" className="space-y-6">
      {/* Bento Stage Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
            02
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                Stage 2 of 4 • Central Database
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Google Sheets: Real-Time Lead Store
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Every form submission is stored as an immutable record with timestamps, pipeline stages, notes, and delivery flags. Updates made here write straight to your Google Drive spreadsheet.
            </p>
          </div>
        </div>
      </div>

      {!sheetConfig ? (
        /* Provision Sheet Card in Bento Style */
        <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Provision Google Spreadsheet CRM Database
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-2xl">
            Initialize your CRM spreadsheet in Google Drive with pre-formatted headers (Timestamp, Name, Email, Phone, Company, Service, Budget, Status, Welcome Sent).
          </p>

          <button
            id="provision-crm-sheet-btn"
            type="button"
            disabled={isLoading}
            onClick={() => onCreateSheet()}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Google Sheet...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Google CRM Spreadsheet</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active CRM Spreadsheet Bento View */
        <div className="space-y-6">
          {/* Bento Metrics Quad */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Inquiries</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{totalLeads}</div>
              <div className="text-xs text-slate-500 mt-1">Spreadsheet records</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-black uppercase text-blue-600 tracking-wider">New Leads</div>
              <div className="text-3xl font-black text-blue-700 mt-1">{newLeads}</div>
              <div className="text-xs text-blue-600/80 mt-1">Awaiting initial call</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">Auto-Welcomed</div>
              <div className="text-3xl font-black text-indigo-700 mt-1">{emailsSent}</div>
              <div className="text-xs text-indigo-600/80 mt-1">Apps Script dispatched</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">Converted Clients</div>
              <div className="text-3xl font-black text-emerald-700 mt-1">{convertedLeads}</div>
              <div className="text-xs text-emerald-600/80 mt-1">
                {totalLeads > 0 ? `${Math.round((convertedLeads / totalLeads) * 100)}% conversion` : '0% conversion'}
              </div>
            </div>
          </div>

          {/* Bento Spreadsheet Control Strip */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{sheetConfig.title}</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                    Tab: {sheetConfig.sheetName}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Last synced: {sheetConfig.lastSynced || 'Just now'}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700">{leads.length} rows loaded</span>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <a
                id="open-google-sheet-external-btn"
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open in Sheets</span>
              </a>

              <button
                id="refresh-sheet-data-btn"
                onClick={onRefreshLeads}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                <span>Sync Rows</span>
              </button>

              <button
                id="open-add-lead-modal-btn"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Client Manually</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Capsule Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="sheet-search-input"
                type="text"
                placeholder="Search by name, email, company, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Discussion">In Discussion</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Converted">Converted</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                id="filter-email-select"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Emails</option>
                <option value="SENT">Welcome Sent</option>
                <option value="PENDING">Email Pending</option>
              </select>
            </div>
          </div>

          {/* CRM Leads Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Client Contact</th>
                    <th className="px-5 py-3.5">Company & Service</th>
                    <th className="px-5 py-3.5">Pipeline Status</th>
                    <th className="px-5 py-3.5">Welcome Email</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Table className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700">No client leads found</p>
                          <p className="text-xs text-slate-400">
                            Submit a test lead via the Google Form tab or click "Add Client Manually" above.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Client Contact */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{lead.fullName}</div>
                          <div className="text-slate-500">{lead.email}</div>
                          {lead.phone && <div className="text-slate-400 text-[11px]">{lead.phone}</div>}
                        </td>

                        {/* Company & Service */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {lead.company || 'Direct Client'}
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {lead.service}
                          </div>
                          {lead.budgetNotes && (
                            <div className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[180px]">
                              {lead.budgetNotes}
                            </div>
                          )}
                        </td>

                        {/* Pipeline Status Dropdown */}
                        <td className="px-5 py-3.5">
                          <div className="relative inline-block">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                onUpdateLeadStatus(lead, e.target.value as ClientLead['status'])
                              }
                              className={`text-[11px] font-bold px-3 py-1 rounded-full border cursor-pointer focus:outline-none appearance-none pr-7 ${getStatusBadge(
                                lead.status
                              )}`}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="In Discussion">In Discussion</option>
                              <option value="Proposal Sent">Proposal Sent</option>
                              <option value="Converted">Converted</option>
                              <option value="Closed">Closed</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>

                        {/* Welcome Email Status */}
                        <td className="px-5 py-3.5">
                          {lead.welcomeEmailSent ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span>Sent</span>
                                {lead.welcomeEmailDate && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {lead.welcomeEmailDate}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>Pending</span>
                            </div>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs font-mono">
                          {lead.timestamp}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            id={`send-email-btn-${lead.id}`}
                            onClick={() => onSendSingleEmail(lead)}
                            title={lead.welcomeEmailSent ? 'Resend Welcome Email' : 'Send Welcome Email'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors shadow-xs"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{lead.welcomeEmailSent ? 'Resend' : 'Send Email'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer & Advance */}
            <div className="p-5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-500">
                Step 2 Complete • Database synced with Google Drive
              </div>
              <button
                id="advance-to-script-btn"
                onClick={onAdvanceToScript}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                <span>Continue to Step 3: Google Apps Script</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Client Modal in Bento Styling */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-7 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-1">
              Add New Client to Google Sheets
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Directly appends a new lead record to the active Google Spreadsheet.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Robert Smith"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="client@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Interested In *
                </label>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
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
                <input
                  type="text"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="$10,000 budget"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Referred by partner..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="confirm-manual-add-lead-btn"
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Saving to Sheet...' : 'Append Row to Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
