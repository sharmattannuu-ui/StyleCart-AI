import React from 'react';
import { Bot, Mail, Sparkles } from 'lucide-react';
import { TabType } from './Sidebar.js';
import { useAuth } from '../context/AuthContext.js';

interface HeaderProps {
  currentTab: TabType;
  onOpenAgent: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenAgent }) => {
  const { isGmailConnected } = useAuth();

  const titles: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Store Dashboard',
      subtitle: 'Overview of customers, clothing stocks, and enquiries'
    },
    customers: {
      title: 'Customers Directory',
      subtitle: 'Customer profiles and communication records'
    },
    products: {
      title: 'Clothing Products',
      subtitle: 'Apparel catalog with Indian Rupee (INR ₹) pricing'
    },
    enquiries: {
      title: 'Sales Enquiries',
      subtitle: 'Customer inquiries, AI drafts, and resolution tracking'
    },
    gmail: {
      title: 'Gmail Inbox Sync',
      subtitle: 'Customer enquiry emails with Google OAuth 2.0 authorization'
    },
    agent: {
      title: 'AI Sales Assistant',
      subtitle: 'Natural language queries executed with backend database tools'
    }
  };

  const current = titles[currentTab] || titles.dashboard;

  return (
    <header className="h-16 bg-white border-b border-[#EFE9DF] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="font-serif font-bold text-lg text-stone-900 leading-tight">
          {current.title}
        </h1>
        <p className="text-[11px] text-stone-500 font-medium">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Gmail Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#FAF8F5] border border-[#EFE9DF]">
          <Mail className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-stone-600 font-medium">
            {isGmailConnected ? (
              <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Gmail Linked
              </span>
            ) : (
              <span className="text-stone-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Gmail Idle
              </span>
            )}
          </span>
        </div>

        {/* AI Agent Quick Trigger Button */}
        {currentTab !== 'agent' && (
          <button
            onClick={onOpenAgent}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Sales Agent</span>
          </button>
        )}
      </div>
    </header>
  );
};
