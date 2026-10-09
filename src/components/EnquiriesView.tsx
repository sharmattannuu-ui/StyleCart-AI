import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Mail,
  Trash2,
  X,
  ExternalLink,
  Bot,
  User,
  ShoppingBag
} from 'lucide-react';
import { Enquiry, EnquiryStatus, Product, Customer } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

interface EnquiriesViewProps {
  enquiries: Enquiry[];
  products: Product[];
  customers: Customer[];
  selectedEnquiry: Enquiry | null;
  onSelectEnquiry: (enquiry: Enquiry | null) => void;
  onCreateEnquiry: (data: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => Promise<void>;
  onUpdateStatus: (id: string, status: EnquiryStatus) => Promise<void>;
  onAddReply: (id: string, message: string, sender: 'Staff' | 'AI Assistant', sentViaGmail?: boolean) => Promise<void>;
  onGenerateAiDraft: (id: string) => Promise<string>;
  onSendGmailReply: (to: string, subject: string, body: string, enquiryId: string) => Promise<void>;
  onDeleteEnquiry: (id: string) => Promise<void>;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  enquiries,
  products,
  customers,
  selectedEnquiry,
  onSelectEnquiry,
  onCreateEnquiry,
  onUpdateStatus,
  onAddReply,
  onGenerateAiDraft,
  onSendGmailReply,
  onDeleteEnquiry
}) => {
  const { isGmailConnected } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'All' | EnquiryStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New enquiry form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    channel: 'Email' as const,
    subject: '',
    message: '',
    productId: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reply state in detail view
  const [replyMessage, setReplyMessage] = useState('');
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState<{
    to: string;
    subject: string;
    body: string;
  } | null>(null);

  // Filtered list
  const filteredEnquiries = enquiries.filter(e => {
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.productName && e.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const handleOpenCreate = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      channel: 'Email',
      subject: '',
      message: '',
      productId: ''
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSelectCustomerPreset = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        customerName: cust.name,
        customerEmail: cust.email,
        customerPhone: cust.phone
      }));
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerEmail.trim()) {
      setFormError('Please enter customer name and valid email.');
      return;
    }
    if (!formData.subject.trim() || !formData.message.trim()) {
      setFormError('Please provide an enquiry subject and customer query text.');
      return;
    }

    setIsCreating(true);
    try {
      const selectedProduct = products.find(p => p.id === formData.productId);
      await onCreateEnquiry({
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim() || undefined,
        channel: formData.channel,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: 'Pending',
        productId: formData.productId || undefined,
        productName: selectedProduct?.name || undefined
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record enquiry');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateAiDraftClick = async () => {
    if (!selectedEnquiry) return;
    setIsDraftingAi(true);
    try {
      const draft = await onGenerateAiDraft(selectedEnquiry.id);
      setReplyMessage(draft);
    } catch (err: any) {
      alert(`Could not generate AI draft: ${err.message}`);
    } finally {
      setIsDraftingAi(false);
    }
  };

  const handleSendStandardReply = async () => {
    if (!selectedEnquiry || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      await onAddReply(selectedEnquiry.id, replyMessage.trim(), 'Staff', false);
      setReplyMessage('');
    } catch (err: any) {
      alert(`Failed to save reply: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleInitiateGmailSend = () => {
    if (!selectedEnquiry || !replyMessage.trim()) return;
    if (!isGmailConnected) {
      alert('Please connect your Google account in Gmail Sync before sending direct emails.');
      return;
    }
    // Present explicit user confirmation dialog
    setSendConfirmation({
      to: selectedEnquiry.customerEmail,
      subject: `Re: ${selectedEnquiry.subject}`,
      body: replyMessage.trim()
    });
  };

  const handleConfirmSendGmail = async () => {
    if (!sendConfirmation || !selectedEnquiry) return;
    setIsSendingReply(true);
    try {
      await onSendGmailReply(
        sendConfirmation.to,
        sendConfirmation.subject,
        sendConfirmation.body,
        selectedEnquiry.id
      );
      setSendConfirmation(null);
      setReplyMessage('');
      alert(`Email sent successfully to ${sendConfirmation.to} via Gmail!`);
    } catch (err: any) {
      alert(`Failed to send email: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await onDeleteEnquiry(deleteConfirmId);
      if (selectedEnquiry?.id === deleteConfirmId) {
        onSelectEnquiry(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Failed to delete enquiry: ${err.message}`);
    }
  };

  // Linked product info
  const linkedProduct = selectedEnquiry?.productId
    ? products.find(p => p.id === selectedEnquiry.productId)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">Sales Enquiries</h1>
          <p className="text-sm text-stone-500">
            Track customer requests, check stock availability, and draft polite replies.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg text-sm font-medium shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Enquiry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search enquiries by customer, subject, message, or clothing item..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-[#EFE9DF] rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-stone-900 text-amber-100'
                  : 'bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1] border border-[#EFE9DF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xs overflow-hidden">
        <div className="divide-y divide-[#EFE9DF]">
          {filteredEnquiries.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-sm">
              No sales enquiries found.
            </div>
          ) : (
            filteredEnquiries.map(enquiry => (
              <div
                key={enquiry.id}
                onClick={() => onSelectEnquiry(enquiry)}
                className="p-4 hover:bg-[#FAF8F5] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                      {enquiry.id}
                    </span>
                    <span className="font-serif font-bold text-base text-stone-950 group-hover:text-amber-950 transition-colors">
                      {enquiry.subject}
                    </span>
                    <span className="text-xs text-stone-400">via {enquiry.channel}</span>
                    {enquiry.productName && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F4EFE6] text-stone-800 border border-[#E8DEC8]">
                        👗 {enquiry.productName}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2">{enquiry.message}</p>

                  <div className="flex items-center gap-3 text-xs text-stone-400 pt-0.5">
                    <span className="text-stone-700 font-medium">{enquiry.customerName}</span>
                    <span>•</span>
                    <span>{enquiry.customerEmail}</span>
                    <span>•</span>
                    <span>
                      {new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {enquiry.replies?.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {enquiry.replies.length} replies
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={enquiry.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => onUpdateStatus(enquiry.id, e.target.value as EnquiryStatus)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none ${
                      enquiry.status === 'Pending'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : enquiry.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeleteConfirmId(enquiry.id);
                    }}
                    title="Delete Enquiry"
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record New Enquiry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">Record Sales Enquiry</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="space-y-3.5">
              {/* Optional Quick Customer Pick */}
              {customers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select Existing Customer (Optional)
                  </label>
                  <select
                    onChange={e => handleSelectCustomerPreset(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-[#FAF8F5]"
                  >
                    <option value="">-- Choose existing customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya@example.com"
                    value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Inquiry Channel</label>
                  <select
                    value={formData.channel}
                    onChange={e => setFormData({ ...formData, channel: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Store Walk-in">Store Walk-in</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Related Product (Optional)</label>
                <select
                  value={formData.productId}
                  onChange={e => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">-- No specific product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price.toLocaleString('en-IN')} - {p.availabilityStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Enquiry Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Size availability for Distressed Jeans"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="What did the customer ask?"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Saving...' : 'Record Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Enquiry Modal & Reply Interface */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                    {selectedEnquiry.id}
                  </span>
                  <h2 className="font-serif text-lg font-bold text-stone-900">
                    {selectedEnquiry.subject}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>Customer: <strong className="text-stone-800">{selectedEnquiry.customerName}</strong> ({selectedEnquiry.customerEmail})</span>
                  <span>•</span>
                  <span>via {selectedEnquiry.channel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedEnquiry.status}
                  onChange={e => onUpdateStatus(selectedEnquiry.id, e.target.value as EnquiryStatus)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none ${
                    selectedEnquiry.status === 'Pending'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : selectedEnquiry.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <button
                  onClick={() => onSelectEnquiry(null)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Linked Product Badge (if any) */}
            {linkedProduct && (
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EFE9DF] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-stone-700" />
                  <div>
                    <span className="text-stone-400">Referenced Product:</span>{' '}
                    <strong className="text-stone-900">{linkedProduct.name}</strong> ({linkedProduct.category})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">₹{linkedProduct.price.toLocaleString('en-IN')}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      linkedProduct.availableStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Stock: {linkedProduct.availableStock} ({linkedProduct.availabilityStatus})
                  </span>
                </div>
              </div>
            )}

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Customer original message */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EFE9DF] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-700" />
                    {selectedEnquiry.customerName}
                  </span>
                  <span>{new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {selectedEnquiry.message}
                </p>
              </div>

              {/* Replies history */}
              {selectedEnquiry.replies?.map(rep => (
                <div
                  key={rep.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                    rep.sender === 'Customer'
                      ? 'bg-[#FAF8F5] border-[#EFE9DF] ml-0'
                      : 'bg-white border-stone-200 ml-4 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span className="font-semibold text-stone-900 flex items-center gap-1">
                      {rep.sender === 'AI Assistant' ? (
                        <Bot className="w-3.5 h-3.5 text-amber-600" />
                      ) : rep.sender === 'Staff' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      {rep.sender} {rep.sentViaGmail && <span className="text-blue-600 font-normal">(Sent via Gmail)</span>}
                    </span>
                    <span>{new Date(rep.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-stone-800 whitespace-pre-wrap">{rep.message}</p>
                </div>
              ))}
            </div>

            {/* AI Draft & Reply Box */}
            <div className="border-t border-stone-100 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">Compose Reply to Customer:</span>
                <button
                  type="button"
                  onClick={handleGenerateAiDraftClick}
                  disabled={isDraftingAi}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-[#F4EFE6] hover:bg-[#ECE4D4] px-2.5 py-1 rounded-lg border border-[#DED3BD] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isDraftingAi ? 'Drafting with AI...' : 'AI Generate Polite Reply'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="Type your reply or click 'AI Generate Polite Reply' above..."
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
              />

              <div className="flex items-center justify-between">
                <div className="text-[11px] text-stone-400">
                  {isGmailConnected ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Gmail Connected: ready to send
                    </span>
                  ) : (
                    <span>Connect Google account to email customer directly</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendStandardReply}
                    disabled={!replyMessage.trim() || isSendingReply}
                    className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg cursor-pointer disabled:opacity-40"
                  >
                    Save as In-App Reply
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiateGmailSend}
                    disabled={!replyMessage.trim() || isSendingReply}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-40"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via Gmail</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal for Consequential Email Sending */}
      {sendConfirmation && (
        <div className="fixed inset-0 z-60 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-stone-900">
              <Mail className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif text-base font-bold">Confirm Email Dispatch via Gmail</h3>
            </div>
            <p className="text-xs text-stone-600">
              You are about to send a real email from your connected Gmail account to:
            </p>
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EFE9DF] text-xs space-y-1">
              <div><strong>To:</strong> {sendConfirmation.to}</div>
              <div><strong>Subject:</strong> {sendConfirmation.subject}</div>
              <div className="pt-1 text-stone-600 line-clamp-3"><strong>Message Preview:</strong> {sendConfirmation.body}</div>
            </div>
            <p className="text-[11px] text-stone-500">
              Please confirm you would like to execute this action.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSendConfirmation(null)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendGmail}
                disabled={isSendingReply}
                className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSendingReply ? 'Sending...' : 'Confirm & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-900">Confirm Deletion</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete this enquiry? This will remove the enquiry and its reply thread.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Delete Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
