import React from 'react';
import { User } from 'firebase/auth';
import {
  FileText,
  Table,
  Code2,
  CheckCircle2,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export type CrmStage = 'form' | 'sheet' | 'script' | 'test';

interface NavbarProps {
  currentStage: CrmStage;
  onSelectStage: (stage: CrmStage) => void;
  user: User | null;
  onLogout: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  hasForm: boolean;
  hasSheet: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStage,
  onSelectStage,
  user,
  onLogout,
  onRefresh,
  isSyncing,
  hasForm,
  hasSheet,
}) => {
  const stages: {
    id: CrmStage;
    label: string;
    num: string;
    actionLabel: string;
    activeColor: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'form',
      label: 'Google Form',
      num: '01',
      actionLabel: 'Capture',
      activeColor: 'bg-indigo-600 text-white shadow-xs border-indigo-600',
      icon: FileText,
    },
    {
      id: 'sheet',
      label: 'Google Sheets',
      num: '02',
      actionLabel: 'Store',
      activeColor: 'bg-emerald-600 text-white shadow-xs border-emerald-600',
      icon: Table,
    },
    {
      id: 'script',
      label: 'Apps Script Engine',
      num: '03',
      actionLabel: 'Automate',
      activeColor: 'bg-slate-900 text-white shadow-xs border-slate-900',
      icon: Code2,
    },
    {
      id: 'test',
      label: 'Validation Suite',
      num: '04',
      actionLabel: 'Verify',
      activeColor: 'bg-rose-600 text-white shadow-xs border-rose-600',
      icon: CheckCircle2,
    },
  ];

  return (
    <header id="crm-main-header" className="bg-slate-50 border-b border-slate-200 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top Header Row in Bento Grid Theme */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Google Workspace CRM Builder
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              No-code customer relationship management workflow
            </p>
          </div>

          {/* Right Bento Status & User Pill */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Bento Status Pill */}
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Status: Ready to Build
              </span>
            </div>

            <button
              id="header-sync-btn"
              onClick={onRefresh}
              disabled={isSyncing}
              title="Sync CRM with Google Sheets & Forms"
              className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Workspace'}</span>
            </button>

            {user && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Account'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-bold">
                    {(user.email || 'K')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left pr-1">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.displayName || 'Kerissa Naicker'}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium leading-tight truncate max-w-[140px]">
                    {user.email || 'kerissanaicker1@gmail.com'}
                  </div>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bento Stage Switcher & Workflow Pipeline Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2.5 min-w-max">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.id;
              const isCompleted =
                (stage.id === 'form' && hasForm) ||
                (stage.id === 'sheet' && hasSheet);

              return (
                <button
                  key={stage.id}
                  id={`nav-stage-${stage.id}`}
                  onClick={() => onSelectStage(stage.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
                    isActive
                      ? stage.activeColor
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <span
                    className={`text-[11px] font-black tracking-wider px-1.5 py-0.5 rounded-lg ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {stage.num}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{stage.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider pl-4">
            <span className="text-indigo-600">01 Capture</span>
            <span>→</span>
            <span className="text-emerald-600">02 Store</span>
            <span>→</span>
            <span className="text-slate-900">03 Automate</span>
            <span>→</span>
            <span className="text-rose-600">04 Verify</span>
          </div>
        </div>
      </div>
    </header>
  );
};
