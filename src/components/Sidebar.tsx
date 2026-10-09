import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shirt,
  MessageSquare,
  Mail,
  Bot,
  Sparkles,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth, GoogleSignInButton } from '../context/AuthContext.js';

export type TabType = 'dashboard' | 'customers' | 'products' | 'enquiries' | 'gmail' | 'agent';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingEnquiriesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingEnquiriesCount
}) => {
  const { user, isGmailConnected, gmailAccount, isLoggingIn, signIn, signOut } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'customers' as TabType,
      label: 'Customers',
      icon: Users,
      badge: null
    },
    {
      id: 'products' as TabType,
      label: 'Products',
      icon: Shirt,
      badge: null
    },
    {
      id: 'enquiries' as TabType,
      label: 'Sales Enquiries',
      icon: MessageSquare,
      badge: pendingEnquiriesCount > 0 ? pendingEnquiriesCount : null,
      badgeColor: 'bg-amber-600 text-white'
    },
    {
      id: 'gmail' as TabType,
      label: 'Gmail Sync',
      icon: Mail,
      badge: isGmailConnected ? 'Active' : 'Setup',
      badgeColor: isGmailConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-200 text-stone-700'
    },
    {
      id: 'agent' as TabType,
      label: 'AI Sales Agent',
      icon: Bot,
      highlight: true
    }
  ];

  const activeEmail = gmailAccount?.email || user?.email;
  const activeName = gmailAccount?.name || user?.displayName || activeEmail?.split('@')[0] || 'Authorized User';

  return (
    <aside className="w-64 bg-white border-r border-[#EFE9DF] flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#EFE9DF]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-lg text-stone-950 tracking-tight">StyleCart</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F4EFE6] text-stone-800 tracking-wider uppercase border border-[#E8DEC8]">
                AI
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium leading-tight">Smart Clothing Sales Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          Store Management
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#F4EFE6] text-stone-950 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-stone-900' : 'text-stone-500'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    Live
                  </span>
                )}
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    item.badgeColor || 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Gmail & User Footer Card */}
      <div className="p-3 border-t border-[#EFE9DF] bg-[#FAF8F5]">
        {isGmailConnected && activeEmail ? (
          <div className="p-3 bg-white rounded-lg border border-[#EAE3D5] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {activeName[0]?.toUpperCase() || 'U'}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {activeName}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{activeEmail}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                title="Disconnect Google account"
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
              <span className="text-emerald-700 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Gmail Sync Active
              </span>
              <button
                onClick={signOut}
                className="text-stone-400 hover:text-rose-600 text-[10px] cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-white rounded-lg border border-[#EAE3D5] text-center shadow-xs">
            <p className="text-xs font-semibold text-stone-900 mb-1">Gmail Synchronization</p>
            <p className="text-[11px] text-stone-500 mb-2.5">
              Connect to sync clothing enquiries directly from your emails.
            </p>
            <GoogleSignInButton
              onClick={signIn}
              loading={isLoggingIn}
              text="Connect Gmail"
              className="w-full text-xs py-1.5"
            />
          </div>
        )}

        <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] text-stone-400">
          <span>Currency: INR (₹)</span>
          <span className="font-mono text-[10px]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
