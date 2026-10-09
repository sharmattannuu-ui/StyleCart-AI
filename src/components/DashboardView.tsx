import React from 'react';
import {
  Users,
  Shirt,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  Bot,
  Mail,
  ChevronRight,
  TrendingUp,
  PackageX
} from 'lucide-react';
import { DashboardStats, Enquiry, Product } from '../types/index.js';
import { TabType } from './Sidebar.js';

interface DashboardViewProps {
  stats: DashboardStats | null;
  enquiries: Enquiry[];
  products: Product[];
  onNavigate: (tab: TabType) => void;
  onOpenNewEnquiry: () => void;
  onOpenNewProduct: () => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  enquiries,
  products,
  onNavigate,
  onOpenNewEnquiry,
  onOpenNewProduct,
  onSelectEnquiry
}) => {
  const recentEnquiries = enquiries.slice(0, 5);
  const outOfStockItems = products.filter(p => p.availableStock === 0 || p.availabilityStatus === 'Out of Stock');
  const lowStockItems = products.filter(p => p.availableStock > 0 && p.availableStock <= 8);

  const totalEnquiries = stats
    ? stats.pendingEnquiries + stats.inProgressEnquiries + stats.resolvedEnquiries
    : 0;

  const resolutionRate = totalEnquiries > 0
    ? Math.round((stats?.resolvedEnquiries || 0) / totalEnquiries * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-xl border border-[#EFE9DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Store Sales & Inventory Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4EFE6] text-stone-800 border border-[#E8DEC8]">
              Live Assistant
            </span>
          </div>
          <p className="text-sm text-stone-500">
            Welcome to StyleCart AI. Monitor customer conversations, clothing stocks, and sync Gmail enquiries in real time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('agent')}
            className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg text-sm font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Bot className="w-4 h-4 text-amber-200" />
            <span>Ask AI Sales Agent</span>
          </button>
          <button
            onClick={onOpenNewEnquiry}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F4EFE6] hover:bg-[#EAE2D2] text-stone-900 border border-[#DED3BD] rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-stone-700" />
            <span>New Enquiry</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs hover:border-[#D5C7B0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:bg-[#F4EFE6] transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-serif text-stone-950">
              {stats?.totalCustomers ?? '—'}
            </div>
            <span className="text-xs text-stone-500 flex items-center gap-1 group-hover:text-stone-900">
              Manage CRM <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">Active store customer records</p>
        </div>

        {/* Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs hover:border-[#D5C7B0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:bg-[#F4EFE6] transition-colors">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-serif text-stone-950">
              {stats?.totalProducts ?? '—'}
            </div>
            <span className="text-xs text-stone-500 flex items-center gap-1 group-hover:text-stone-900">
              View Catalog <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">Shirts, Jeans, Dresses, Jackets</p>
        </div>

        {/* Pending Enquiries */}
        <div
          onClick={() => onNavigate('enquiries')}
          className="bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs hover:border-[#D5C7B0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Pending Enquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-serif text-amber-900">
              {stats?.pendingEnquiries ?? '—'}
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Needs Reply
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">Awaiting customer response</p>
        </div>

        {/* Resolved Enquiries */}
        <div
          onClick={() => onNavigate('enquiries')}
          className="bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs hover:border-[#D5C7B0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Resolved Enquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-serif text-emerald-900">
              {stats?.resolvedEnquiries ?? '—'}
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {resolutionRate}% Rate
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-2">Successfully closed requests</p>
        </div>
      </div>

      {/* Two Column Layout: Visual Status Breakdown & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown & Performance */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="font-serif font-bold text-base text-stone-900">Inventory Distribution</h2>
            <span className="text-xs text-stone-500 font-medium">Categories</span>
          </div>

          <div className="space-y-3 pt-1">
            {stats && Object.entries(stats.categoryBreakdown).map(([category, count]) => {
              const pct = Math.round((count / (stats.totalProducts || 1)) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-stone-700">
                    <span>{category}</span>
                    <span className="text-stone-500">{count} items ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#F7F4EE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-800 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
            <span>Enquiry Health:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {stats?.pendingEnquiries || 0} Pending
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {stats?.resolvedEnquiries || 0} Resolved
              </span>
            </div>
          </div>
        </div>

        {/* Recent Enquiries Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900">Recent Customer Enquiries</h2>
              <p className="text-xs text-stone-500">Live requests from WhatsApp, Email, Walk-in, and Gmail</p>
            </div>
            <button
              onClick={() => onNavigate('enquiries')}
              className="text-xs font-semibold text-stone-700 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              View All ({enquiries.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {recentEnquiries.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">
                No customer enquiries recorded yet.
              </div>
            ) : (
              recentEnquiries.map(enq => (
                <div
                  key={enq.id}
                  onClick={() => onSelectEnquiry(enq)}
                  className="py-3 flex items-start justify-between gap-3 hover:bg-[#FAF8F5] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-stone-900 truncate">
                        {enq.customerName}
                      </span>
                      <span className="text-[11px] text-stone-400">via {enq.channel}</span>
                      {enq.productName && (
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200 truncate max-w-[150px]">
                          {enq.productName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-stone-800 line-clamp-1">{enq.subject}</p>
                    <p className="text-xs text-stone-500 line-clamp-1">{enq.message}</p>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        enq.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : enq.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {enq.status}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Out of Stock & Stock Alerts Alert Card */}
      <div className="bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PackageX className="w-4 h-4 text-rose-600" />
            <h2 className="font-serif font-bold text-base text-stone-900">Inventory Attention Needed</h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-stone-700 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            Manage Products <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
          <p className="text-sm text-stone-500 py-2">All products are healthy and in stock!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {outOfStockItems.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs text-stone-900 truncate max-w-[180px]">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-rose-100 text-rose-700">
                      Out of Stock
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">₹{p.price.toLocaleString('en-IN')} • {p.category}</p>
                </div>
                <span className="text-xs font-bold text-rose-700">0 left</span>
              </div>
            ))}

            {lowStockItems.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs text-stone-900 truncate max-w-[180px]">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800">
                      Low Stock
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">₹{p.price.toLocaleString('en-IN')} • {p.category}</p>
                </div>
                <span className="text-xs font-bold text-amber-800">{p.availableStock} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
