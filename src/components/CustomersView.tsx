import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Clock,
  MessageSquare,
  FileText,
  X,
  AlertCircle,
  ChevronRight,
  Send
} from 'lucide-react';
import { Customer, CommunicationRecord } from '../types/index.js';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'communicationHistory'>) => Promise<void>;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onAddCommunication: (customerId: string, message: string, type: 'note' | 'call' | 'reply') => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddCommunication
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredCategory: 'Shirts',
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New communication note state
  const [newCommNote, setNewCommNote] = useState('');
  const [commType, setCommType] = useState<'note' | 'call' | 'reply'>('note');

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      (c.preferredCategory && c.preferredCategory.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      preferredCategory: 'Shirts',
      notes: ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      preferredCategory: c.preferredCategory || 'Shirts',
      notes: c.notes || ''
    });
    setFormError(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError('Please enter name, valid email, and phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddCustomer(formData);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError('Please enter name, valid email, and phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdateCustomer(editingCustomer.id, formData);
      if (activeCustomerDetail?.id === editingCustomer.id) {
        setActiveCustomerDetail({ ...activeCustomerDetail, ...formData });
      }
      setEditingCustomer(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await onDeleteCustomer(deleteConfirmId);
      if (activeCustomerDetail?.id === deleteConfirmId) {
        setActiveCustomerDetail(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Error deleting customer: ${err.message}`);
    }
  };

  const handleAddNoteToCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerDetail || !newCommNote.trim()) return;
    try {
      await onAddCommunication(activeCustomerDetail.id, newCommNote.trim(), commType);
      // update local detail
      const newRec: CommunicationRecord = {
        id: `comm-${Date.now()}`,
        date: new Date().toISOString(),
        type: commType,
        message: newCommNote.trim(),
        staffName: 'Staff'
      };
      setActiveCustomerDetail({
        ...activeCustomerDetail,
        communicationHistory: [...activeCustomerDetail.communicationHistory, newRec]
      });
      setNewCommNote('');
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">Customer CRM</h1>
          <p className="text-sm text-stone-500">
            Manage customer contacts, preferences, and full communication timeline.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg text-sm font-medium shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-[#EFE9DF] rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-stone-500 font-medium">Interest:</span>
          {['All', 'Jeans', 'Shirts', 'Dresses', 'Jackets'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-amber-100'
                  : 'bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1] border border-[#EFE9DF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table / Cards */}
      <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-800">
            <thead className="bg-[#FAF8F5] border-b border-[#EFE9DF] text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Preferred Style</th>
                <th className="px-5 py-3.5">Notes & History</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DF]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-5 py-4">
                      <div
                        onClick={() => setActiveCustomerDetail(customer)}
                        className="font-medium text-stone-900 cursor-pointer hover:underline flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 font-semibold flex items-center justify-center text-xs">
                          {customer.name[0]}
                        </div>
                        <div>
                          <div>{customer.name}</div>
                          <span className="text-[11px] text-stone-400">ID: {customer.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-stone-700">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-700">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4EFE6] text-stone-800 border border-[#E8DEC8]">
                        {customer.preferredCategory || 'General'}
                      </span>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-xs text-stone-600 truncate">{customer.notes || 'No customer notes recorded.'}</p>
                      <button
                        onClick={() => setActiveCustomerDetail(customer)}
                        className="text-[11px] font-medium text-amber-900 hover:text-black flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{customer.communicationHistory?.length || 0} communications</span>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveCustomerDetail(customer)}
                          title="View Details & History"
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-[#F4EFE6] rounded transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(customer)}
                          title="Edit Customer"
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-[#F4EFE6] rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(customer.id)}
                          title="Delete Customer"
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
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

            <form onSubmit={editingCustomer ? handleSubmitEdit : handleSubmitAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.sharma@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred Style Category</label>
                <select
                  value={formData.preferredCategory}
                  onChange={e => setFormData({ ...formData, preferredCategory: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
                >
                  <option value="Shirts">Shirts</option>
                  <option value="Jeans">Jeans</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Jackets">Jackets</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Activewear">Activewear</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Preferences & Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Size 30 in stretch jeans, loves floral prints, weekend regular"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer / Modal with Communication Timeline */}
      {activeCustomerDetail && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 text-amber-100 font-serif font-bold text-base flex items-center justify-center">
                  {activeCustomerDetail.name[0]}
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900">{activeCustomerDetail.name}</h2>
                  <p className="text-xs text-stone-500">Customer Profile & Communication Record</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCustomerDetail(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EFE9DF] text-xs">
              <div>
                <span className="text-stone-400 font-medium">Email</span>
                <p className="font-semibold text-stone-800 mt-0.5 truncate">{activeCustomerDetail.email}</p>
              </div>
              <div>
                <span className="text-stone-400 font-medium">Phone</span>
                <p className="font-semibold text-stone-800 mt-0.5">{activeCustomerDetail.phone}</p>
              </div>
              <div>
                <span className="text-stone-400 font-medium">Preferred Style</span>
                <p className="font-semibold text-stone-800 mt-0.5">{activeCustomerDetail.preferredCategory || 'General'}</p>
              </div>
            </div>

            {activeCustomerDetail.notes && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/70 text-xs text-stone-700">
                <span className="font-semibold text-amber-900">Store Notes:</span> {activeCustomerDetail.notes}
              </div>
            )}

            {/* Communication Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Communication History ({activeCustomerDetail.communicationHistory?.length || 0})
              </h3>

              {(!activeCustomerDetail.communicationHistory || activeCustomerDetail.communicationHistory.length === 0) ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No interactions recorded yet. Log an enquiry, call, or customer note below.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-stone-200">
                  {activeCustomerDetail.communicationHistory.map(comm => (
                    <div key={comm.id} className="relative flex items-start gap-3 pl-6">
                      <div className="absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-stone-700 ring-4 ring-white" />
                      <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EFE9DF] flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold capitalize text-stone-800">
                            {comm.type} {comm.staffName && `• ${comm.staffName}`}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(comm.date).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-stone-600 whitespace-pre-wrap">{comm.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add note/call log form */}
            <form onSubmit={handleAddNoteToCustomer} className="pt-3 border-t border-stone-100 flex gap-2">
              <select
                value={commType}
                onChange={e => setCommType(e.target.value as any)}
                className="text-xs bg-[#FAF8F5] border border-stone-300 rounded-lg px-2 py-2 shrink-0"
              >
                <option value="note">Note</option>
                <option value="call">Phone Call</option>
                <option value="reply">Direct Reply</option>
              </select>
              <input
                type="text"
                placeholder="Log customer contact or store note..."
                value={newCommNote}
                onChange={e => setNewCommNote(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />
              <button
                type="submit"
                disabled={!newCommNote.trim()}
                className="px-3 py-2 bg-stone-900 text-amber-100 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-900">Confirm Deletion</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to permanently delete this customer record? All linked communication history will be removed.
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
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
