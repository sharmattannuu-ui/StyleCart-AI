/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Sidebar, TabType } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { CustomersView } from './components/CustomersView.js';
import { ProductsView } from './components/ProductsView.js';
import { EnquiriesView } from './components/EnquiriesView.js';
import { GmailView } from './components/GmailView.js';
import { AiAgentView } from './components/AiAgentView.js';
import { Customer, Product, Enquiry, DashboardStats, EnquiryStatus } from './types/index.js';
import { api } from './lib/api.js';
import { AlertCircle, RefreshCw } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [statsData, customersData, productsData, enquiriesData] = await Promise.all([
        api.getDashboardStats(),
        api.getCustomers(),
        api.getProducts(),
        api.getEnquiries()
      ]);
      setStats(statsData);
      setCustomers(customersData);
      setProducts(productsData);
      setEnquiries(enquiriesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setFetchError(err.message || 'Failed to connect to backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ---------------- Customers Actions ----------------
  const handleAddCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'communicationHistory'>) => {
    const created = await api.createCustomer(data);
    setCustomers(prev => [created, ...prev]);
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    const updated = await api.updateCustomer(id, updates);
    setCustomers(prev => prev.map(c => (c.id === id ? updated : c)));
  };

  const handleDeleteCustomer = async (id: string) => {
    await api.deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleAddCommunication = async (customerId: string, message: string, type: 'note' | 'call' | 'reply') => {
    await api.updateCustomer(customerId, {
      // API handles communication record appending
    });
    // refresh customers
    const fresh = await api.getCustomers();
    setCustomers(fresh);
  };

  // ---------------- Products Actions ----------------
  const handleAddProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.createProduct(data);
    setProducts(prev => [created, ...prev]);
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await api.updateProduct(id, updates);
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  // ---------------- Enquiries Actions ----------------
  const handleCreateEnquiry = async (data: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => {
    const created = await api.createEnquiry(data);
    setEnquiries(prev => [created, ...prev]);
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleUpdateEnquiryStatus = async (id: string, status: EnquiryStatus) => {
    const updated = await api.updateEnquiry(id, { status });
    setEnquiries(prev => prev.map(e => (e.id === id ? updated : e)));
    if (selectedEnquiry?.id === id) {
      setSelectedEnquiry(updated);
    }
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleAddReply = async (
    enquiryId: string,
    message: string,
    sender: 'Staff' | 'AI Assistant',
    sentViaGmail?: boolean
  ) => {
    const updated = await api.addEnquiryReply(enquiryId, { message, sender, sentViaGmail });
    setEnquiries(prev => prev.map(e => (e.id === enquiryId ? updated : e)));
    if (selectedEnquiry?.id === enquiryId) {
      setSelectedEnquiry(updated);
    }
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  const handleGenerateAiDraft = async (enquiryId: string): Promise<string> => {
    return await api.generateAiDraft(enquiryId);
  };

  const handleSendGmailReply = async (to: string, subject: string, body: string, enquiryId: string) => {
    await api.sendGmailReply(to, subject, body, enquiryId);
    // Refresh enquiry
    const updated = await api.getEnquiry(enquiryId);
    setEnquiries(prev => prev.map(e => (e.id === enquiryId ? updated : e)));
    if (selectedEnquiry?.id === enquiryId) {
      setSelectedEnquiry(updated);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    await api.deleteEnquiry(id);
    setEnquiries(prev => prev.filter(e => e.id !== id));
    if (selectedEnquiry?.id === id) {
      setSelectedEnquiry(null);
    }
    const updatedStats = await api.getDashboardStats();
    setStats(updatedStats);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] text-stone-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'enquiries') {
            setSelectedEnquiry(null);
          }
        }}
        pendingEnquiriesCount={stats?.pendingEnquiries || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          currentTab={currentTab}
          onOpenAgent={() => setCurrentTab('agent')}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {fetchError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={loadAllData}
                className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && !stats ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin text-stone-500" />
              <p className="text-sm font-medium">Loading StyleCart AI Store Data...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  enquiries={enquiries}
                  products={products}
                  onNavigate={setCurrentTab}
                  onOpenNewEnquiry={() => {
                    setCurrentTab('enquiries');
                  }}
                  onOpenNewProduct={() => {
                    setCurrentTab('products');
                  }}
                  onSelectEnquiry={enq => {
                    setSelectedEnquiry(enq);
                    setCurrentTab('enquiries');
                  }}
                />
              )}

              {currentTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onAddCommunication={handleAddCommunication}
                />
              )}

              {currentTab === 'products' && (
                <ProductsView
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

              {currentTab === 'enquiries' && (
                <EnquiriesView
                  enquiries={enquiries}
                  products={products}
                  customers={customers}
                  selectedEnquiry={selectedEnquiry}
                  onSelectEnquiry={setSelectedEnquiry}
                  onCreateEnquiry={handleCreateEnquiry}
                  onUpdateStatus={handleUpdateEnquiryStatus}
                  onAddReply={handleAddReply}
                  onGenerateAiDraft={handleGenerateAiDraft}
                  onSendGmailReply={handleSendGmailReply}
                  onDeleteEnquiry={handleDeleteEnquiry}
                />
              )}

              {currentTab === 'gmail' && (
                <GmailView
                  onEnquiryCreated={() => {
                    loadAllData();
                  }}
                />
              )}

              {currentTab === 'agent' && (
                <AiAgentView
                  onRefreshData={loadAllData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
