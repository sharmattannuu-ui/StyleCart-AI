import { Customer, Product, Enquiry, DashboardStats, GmailEmail, ChatMessage, AgentActionProposal } from '../types/index.js';
import { getAccessToken } from './firebase.js';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await request<{ success: boolean; data: DashboardStats }>('/api/dashboard/stats');
    return res.data;
  },

  // Customers
  async getCustomers(query?: string): Promise<Customer[]> {
    const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : '/api/customers';
    const res = await request<{ success: boolean; data: Customer[] }>(url);
    return res.data;
  },

  async getCustomer(id: string): Promise<Customer> {
    const res = await request<{ success: boolean; data: Customer }>(`/api/customers/${id}`);
    return res.data;
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'communicationHistory'>): Promise<Customer> {
    const res = await request<{ success: boolean; data: Customer }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
    return res.data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const res = await request<{ success: boolean; data: Customer }>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await request(`/api/customers/${id}`, { method: 'DELETE' });
  },

  // Products
  async getProducts(params?: {
    category?: string;
    maxPrice?: number;
    inStockOnly?: boolean;
    outOfStockOnly?: boolean;
    searchQuery?: string;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params?.inStockOnly) searchParams.set('inStockOnly', 'true');
    if (params?.outOfStockOnly) searchParams.set('outOfStockOnly', 'true');
    if (params?.searchQuery) searchParams.set('q', params.searchQuery);

    const qs = searchParams.toString();
    const url = qs ? `/api/products?${qs}` : '/api/products';
    const res = await request<{ success: boolean; data: Product[] }>(url);
    return res.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await request<{ success: boolean; data: Product }>(`/api/products/${id}`);
    return res.data;
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const res = await request<{ success: boolean; data: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return res.data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await request<{ success: boolean; data: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await request(`/api/products/${id}`, { method: 'DELETE' });
  },

  // Enquiries
  async getEnquiries(params?: { status?: string; searchQuery?: string; customerId?: string; productId?: string }): Promise<Enquiry[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.searchQuery) searchParams.set('q', params.searchQuery);
    if (params?.customerId) searchParams.set('customerId', params.customerId);
    if (params?.productId) searchParams.set('productId', params.productId);

    const qs = searchParams.toString();
    const url = qs ? `/api/enquiries?${qs}` : '/api/enquiries';
    const res = await request<{ success: boolean; data: Enquiry[] }>(url);
    return res.data;
  },

  async getEnquiry(id: string): Promise<Enquiry> {
    const res = await request<{ success: boolean; data: Enquiry }>(`/api/enquiries/${id}`);
    return res.data;
  },

  async createEnquiry(enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<Enquiry> {
    const res = await request<{ success: boolean; data: Enquiry }>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiry)
    });
    return res.data;
  },

  async updateEnquiry(id: string, updates: Partial<Enquiry>): Promise<Enquiry> {
    const res = await request<{ success: boolean; data: Enquiry }>(`/api/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteEnquiry(id: string): Promise<void> {
    await request(`/api/enquiries/${id}`, { method: 'DELETE' });
  },

  async addEnquiryReply(enquiryId: string, reply: { message: string; sender?: 'Staff' | 'AI Assistant'; sentViaGmail?: boolean }): Promise<Enquiry> {
    const res = await request<{ success: boolean; data: Enquiry }>(`/api/enquiries/${enquiryId}/reply`, {
      method: 'POST',
      body: JSON.stringify(reply)
    });
    return res.data;
  },

  async generateAiDraft(enquiryId: string): Promise<string> {
    const res = await request<{ success: boolean; draft: string }>(`/api/enquiries/${enquiryId}/generate-ai-draft`, {
      method: 'POST'
    });
    return res.draft;
  },

  // AI Sales Agent Chat
  async chatWithAgent(message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<{
    reply: string;
    toolInvocations: Array<{ toolName: string; params: any; resultSummary: string }>;
    proposal?: AgentActionProposal;
  }> {
    const res = await request<{
      success: boolean;
      data: {
        reply: string;
        toolInvocations: Array<{ toolName: string; params: any; resultSummary: string }>;
        proposal?: AgentActionProposal;
      };
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
    return res.data;
  },

  // Confirm Consequential Action
  async confirmAgentAction(actionType: string, payload: any): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; message: string }>('/api/ai/confirm-action', {
      method: 'POST',
      body: JSON.stringify({ actionType, payload })
    });
    return res;
  },

  // Gmail API
  async getGmailStatus(): Promise<{
    connected: boolean;
    userEmail?: string;
    userName?: string;
    userPhotoUrl?: string;
    connectedAt?: string;
    expired?: boolean;
    error?: string;
  }> {
    const res = await request<{
      success: boolean;
      data: {
        connected: boolean;
        userEmail?: string;
        userName?: string;
        userPhotoUrl?: string;
        connectedAt?: string;
        expired?: boolean;
        error?: string;
      };
    }>('/api/gmail/status');
    return res.data;
  },

  async saveGmailAuthSession(data: {
    accessToken: string;
    email: string;
    name?: string;
    photoUrl?: string;
  }): Promise<{ connected: boolean; userEmail: string; userName: string }> {
    const res = await request<{
      success: boolean;
      data: { connected: boolean; userEmail: string; userName: string };
    }>('/api/gmail/auth-session', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async disconnectGmail(): Promise<void> {
    await request('/api/gmail/disconnect', { method: 'POST' });
  },

  async getGmailMessages(query?: string): Promise<GmailEmail[]> {
    const url = query ? `/api/gmail/messages?q=${encodeURIComponent(query)}` : '/api/gmail/messages';
    const res = await request<{ success: boolean; data: GmailEmail[] }>(url);
    return res.data;
  },

  async importGmailAsEnquiry(email: { senderName: string; senderEmail: string; subject: string; body?: string; snippet?: string }): Promise<Enquiry> {
    const res = await request<{ success: boolean; data: Enquiry }>('/api/gmail/import', {
      method: 'POST',
      body: JSON.stringify(email)
    });
    return res.data;
  },

  async sendGmailReply(to: string, subject: string, body: string, enquiryId?: string): Promise<{ success: boolean }> {
    const res = await request<{ success: boolean; data: any }>('/api/gmail/send-reply', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body, enquiryId })
    });
    return res;
  }
};
