export type EnquiryStatus = 'Pending' | 'In Progress' | 'Resolved';

export type ProductCategory = 'Shirts' | 'Jeans' | 'Dresses' | 'Jackets' | 'Accessories' | 'Activewear';

export type AvailabilityStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface CommunicationRecord {
  id: string;
  date: string;
  type: 'enquiry' | 'reply' | 'call' | 'note';
  message: string;
  staffName?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredCategory?: string;
  notes?: string;
  communicationHistory: CommunicationRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number; // in INR
  availableStock: number;
  availabilityStatus: AvailabilityStatus;
  sizes?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryReply {
  id: string;
  sender: 'Staff' | 'AI Assistant' | 'Customer';
  message: string;
  timestamp: string;
  sentViaGmail?: boolean;
}

export interface Enquiry {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel: 'Email' | 'Store Walk-in' | 'WhatsApp' | 'Phone';
  subject: string;
  message: string;
  status: EnquiryStatus;
  productId?: string;
  productName?: string;
  aiSuggestedReply?: string;
  replies: EnquiryReply[];
  createdAt: string;
  updatedAt: string;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  isImported?: boolean;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  pendingEnquiries: number;
  inProgressEnquiries: number;
  resolvedEnquiries: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: {
    pending: number;
    inProgress: number;
    resolved: number;
  };
}

export interface AgentActionProposal {
  actionId: string;
  actionType: 'send_email' | 'delete_customer' | 'delete_product' | 'delete_enquiry' | 'mark_resolved';
  title: string;
  description: string;
  payload: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolInvocations?: Array<{
    toolName: string;
    params?: any;
    resultSummary?: string;
  }>;
  proposal?: AgentActionProposal;
  isActionExecuted?: boolean;
}
