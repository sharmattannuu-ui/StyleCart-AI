import fs from 'fs';
import path from 'path';
import { Customer, Product, Enquiry, DashboardStats } from '../src/types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

interface DatabaseSchema {
  customers: Customer[];
  products: Product[];
  enquiries: Enquiry[];
}

const initialSeedData: DatabaseSchema = {
  customers: [
    {
      id: 'cust-101',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98765 43210',
      preferredCategory: 'Jeans',
      notes: 'Prefers high-waist stretch denim in size 30. Frequent weekend shopper.',
      createdAt: '2026-09-15T10:30:00.000Z',
      updatedAt: '2026-10-05T14:20:00.000Z',
      communicationHistory: [
        {
          id: 'comm-1',
          date: '2026-09-15T10:35:00.000Z',
          type: 'enquiry',
          message: 'Asked about Slim Fit Indigo Denim Jeans availability in size 30.',
        },
        {
          id: 'comm-2',
          date: '2026-09-15T11:00:00.000Z',
          type: 'reply',
          message: 'Confirmed stock availability and sent sizing chart.',
          staffName: 'Aarav (Sales)',
        },
        {
          id: 'comm-3',
          date: '2026-10-05T14:20:00.000Z',
          type: 'enquiry',
          message: 'Inquired whether Distressed Tapered Denim Jeans will be restocked.',
        }
      ]
    },
    {
      id: 'cust-102',
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '+91 98112 23344',
      preferredCategory: 'Shirts',
      notes: 'Interested in formal linen and office cotton shirts under ₹1,500.',
      createdAt: '2026-09-20T11:00:00.000Z',
      updatedAt: '2026-10-06T09:15:00.000Z',
      communicationHistory: [
        {
          id: 'comm-4',
          date: '2026-10-06T09:15:00.000Z',
          type: 'enquiry',
          message: 'Looking for casual cotton shirts priced below ₹1,000 for office wear.',
        }
      ]
    },
    {
      id: 'cust-103',
      name: 'Ananya Roy',
      email: 'ananya.roy@example.com',
      phone: '+91 97234 56789',
      preferredCategory: 'Dresses',
      notes: 'Loves summer floral prints and breathable fabrics. Size Medium.',
      createdAt: '2026-09-22T14:40:00.000Z',
      updatedAt: '2026-10-04T16:00:00.000Z',
      communicationHistory: [
        {
          id: 'comm-5',
          date: '2026-10-04T16:00:00.000Z',
          type: 'enquiry',
          message: 'Asked about return policy and wash care for Floral Print Summer Midi Dress.',
        },
        {
          id: 'comm-6',
          date: '2026-10-04T16:45:00.000Z',
          type: 'reply',
          message: 'Explained 7-day hassle-free exchange policy and gentle wash instructions.',
          staffName: 'Meera (Support)',
        }
      ]
    },
    {
      id: 'cust-104',
      name: 'Vikram Patel',
      email: 'vikram.patel@example.com',
      phone: '+91 99456 78123',
      preferredCategory: 'Jackets',
      notes: 'Interested in lightweight outer layers for travel.',
      createdAt: '2026-09-28T09:20:00.000Z',
      updatedAt: '2026-10-07T11:30:00.000Z',
      communicationHistory: [
        {
          id: 'comm-7',
          date: '2026-10-07T11:30:00.000Z',
          type: 'enquiry',
          message: 'Inquired about colors for Lightweight Utility Windbreaker Jacket under ₹1,000.',
        }
      ]
    },
    {
      id: 'cust-105',
      name: 'Neha Gupta',
      email: 'neha.gupta@example.com',
      phone: '+91 96543 21890',
      preferredCategory: 'Jeans',
      notes: 'Looking for Relaxed Fit Cargo Jeans in olive or washed black.',
      createdAt: '2026-10-01T15:10:00.000Z',
      updatedAt: '2026-10-08T08:50:00.000Z',
      communicationHistory: [
        {
          id: 'comm-8',
          date: '2026-10-08T08:50:00.000Z',
          type: 'enquiry',
          message: 'Asked if Relaxed Fit Cargo Jeans are currently out of stock and when they will be back.',
        }
      ]
    },
    {
      id: 'cust-106',
      name: 'Arjun Kapoor',
      email: 'arjun.k@example.com',
      phone: '+91 98234 99887',
      preferredCategory: 'Shirts',
      notes: 'First time visitor. Inquired about bulk discount for corporate gifting.',
      createdAt: '2026-10-07T12:00:00.000Z',
      updatedAt: '2026-10-07T12:00:00.000Z',
      communicationHistory: [
        {
          id: 'comm-9',
          date: '2026-10-07T12:00:00.000Z',
          type: 'enquiry',
          message: 'Asked about discount on 20 units of Premium Oxford Cotton Shirt.',
        }
      ]
    }
  ],
  products: [
    {
      id: 'prod-201',
      name: 'Premium Oxford Cotton Shirt',
      category: 'Shirts',
      description: 'Crafted from 100% combed breathable cotton with a structured button-down collar and mother-of-pearl buttons. Perfect for smart-casual and formal styling.',
      price: 1499,
      availableStock: 28,
      availabilityStatus: 'In Stock',
      sizes: ['S', 'M', 'L', 'XL'],
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z'
    },
    {
      id: 'prod-202',
      name: 'Classic Linen Casual Shirt',
      category: 'Shirts',
      description: 'Ultra-lightweight pure linen weave shirt with a relaxed mandarin collar. Pre-washed for maximum softness in tropical weather.',
      price: 999,
      availableStock: 35,
      availabilityStatus: 'In Stock',
      sizes: ['M', 'L', 'XL'],
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z'
    },
    {
      id: 'prod-203',
      name: 'Graphic Oversized Cotton T-Shirt',
      category: 'Shirts',
      description: 'Heavyweight 240 GSM French terry cotton with minimalist typographic typography on back. Drop-shoulder relaxed fit.',
      price: 699,
      availableStock: 42,
      availabilityStatus: 'In Stock',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z'
    },
    {
      id: 'prod-204',
      name: 'Slim Fit Indigo Denim Jeans',
      category: 'Jeans',
      description: 'Mid-rise stretch denim with authentic indigo wash and durable brass rivets. Engineered for comfort and sleek daily wear.',
      price: 1899,
      availableStock: 19,
      availabilityStatus: 'In Stock',
      sizes: ['30', '32', '34', '36'],
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-10-03T10:00:00.000Z'
    },
    {
      id: 'prod-205',
      name: 'Distressed Tapered Denim Jeans',
      category: 'Jeans',
      description: 'Vintage stone-washed denim featuring subtle knee abrasions and a modern tapered hem. Super trendy streetwear silhouette.',
      price: 899,
      availableStock: 0,
      availabilityStatus: 'Out of Stock',
      sizes: ['28', '30', '32'],
      imageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-10-05T10:00:00.000Z'
    },
    {
      id: 'prod-206',
      name: 'Relaxed Fit Cargo Jeans',
      category: 'Jeans',
      description: 'Utilitarian multi-pocket denim with dual side bellows pockets and adjustable ankle bungee cords. Heavyweight 13oz cotton denim.',
      price: 1599,
      availableStock: 0,
      availabilityStatus: 'Out of Stock',
      sizes: ['30', '32', '34'],
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-06T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z'
    },
    {
      id: 'prod-207',
      name: 'Floral Print Summer Midi Dress',
      category: 'Dresses',
      description: 'Flowing rayon midi dress with delicate botanical print, tiered ruffle skirt, and flattering smocked bodice.',
      price: 1299,
      availableStock: 14,
      availabilityStatus: 'In Stock',
      sizes: ['S', 'M', 'L'],
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-08T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z'
    },
    {
      id: 'prod-208',
      name: 'Bohemian Maxi Wrap Dress',
      category: 'Dresses',
      description: 'Elegant V-neck wrap dress with side tie fastening and flutter sleeves. Cut from breathable modal blend fabric.',
      price: 2199,
      availableStock: 8,
      availabilityStatus: 'Low Stock',
      sizes: ['M', 'L'],
      imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z'
    },
    {
      id: 'prod-209',
      name: 'Vintage Faux Leather Bomber Jacket',
      category: 'Jackets',
      description: 'Premium vegan leather outer with ribbed elastic collar, cuffs, and antique brass zip closure. Quilted thermal interior lining.',
      price: 3499,
      availableStock: 5,
      availabilityStatus: 'Low Stock',
      sizes: ['M', 'L', 'XL'],
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-10-03T10:00:00.000Z'
    },
    {
      id: 'prod-210',
      name: 'Lightweight Utility Windbreaker Jacket',
      category: 'Jackets',
      description: 'Water-resistant nylon ripstop shell featuring a concealable storm hood, zippered hand warmers, and breathable mesh lining.',
      price: 950,
      availableStock: 22,
      availabilityStatus: 'In Stock',
      sizes: ['S', 'M', 'L', 'XL'],
      imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-10-05T10:00:00.000Z'
    }
  ],
  enquiries: [
    {
      id: 'ENQ-101',
      customerId: 'cust-101',
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@example.com',
      customerPhone: '+91 98765 43210',
      channel: 'WhatsApp',
      subject: 'Restock date for Distressed Tapered Denim Jeans',
      message: 'Hello StyleCart team, I love your Distressed Tapered Jeans (₹899) but see they are out of stock. Will you be restocking size 30 anytime this week?',
      status: 'Pending',
      productId: 'prod-205',
      productName: 'Distressed Tapered Denim Jeans',
      aiSuggestedReply: 'Hi Priya, thank you for reaching out! The Distressed Tapered Denim Jeans in size 30 are currently scheduled for a fresh restock by next Wednesday. In the meantime, you might also love our Slim Fit Indigo Denim Jeans (₹1,899) which are currently in stock.',
      replies: [],
      createdAt: '2026-10-05T14:20:00.000Z',
      updatedAt: '2026-10-05T14:20:00.000Z'
    },
    {
      id: 'ENQ-102',
      customerId: 'cust-102',
      customerName: 'Rahul Verma',
      customerEmail: 'rahul.verma@example.com',
      customerPhone: '+91 98112 23344',
      channel: 'Email',
      subject: 'Casual cotton shirts under ₹1,000 for office wear',
      message: 'Hi, I am looking for 3-4 shirts suitable for Friday casual office wear. Do you have 100% cotton shirts priced strictly below ₹1,000?',
      status: 'Pending',
      productId: 'prod-202',
      productName: 'Classic Linen Casual Shirt',
      aiSuggestedReply: 'Hello Rahul, thank you for contacting StyleCart AI! Yes, we have our popular Classic Linen Casual Shirt priced right at ₹999, as well as the Graphic Oversized Cotton T-Shirt at ₹699. If you can stretch slightly to ₹1,499, our Premium Oxford Cotton Shirt is also a customer favorite for office wear.',
      replies: [],
      createdAt: '2026-10-06T09:15:00.000Z',
      updatedAt: '2026-10-06T09:15:00.000Z'
    },
    {
      id: 'ENQ-103',
      customerId: 'cust-104',
      customerName: 'Vikram Patel',
      customerEmail: 'vikram.patel@example.com',
      customerPhone: '+91 99456 78123',
      channel: 'Store Walk-in',
      subject: 'Color choices for Lightweight Windbreaker Jacket',
      message: 'Customer visited looking for windbreaker jackets for an upcoming trekking trip. Asked if the ₹950 jacket comes in Olive Green or Navy Blue.',
      status: 'In Progress',
      productId: 'prod-210',
      productName: 'Lightweight Utility Windbreaker Jacket',
      aiSuggestedReply: 'Hello Vikram, our Lightweight Utility Windbreaker Jacket (₹950) is currently available in Slate Black and Olive Green in sizes M and L.',
      replies: [
        {
          id: 'rep-1',
          sender: 'Staff',
          message: 'Showed customer the Olive Green sample. He asked us to hold one piece until Saturday.',
          timestamp: '2026-10-07T11:45:00.000Z'
        }
      ],
      createdAt: '2026-10-07T11:30:00.000Z',
      updatedAt: '2026-10-07T11:45:00.000Z'
    },
    {
      id: 'ENQ-104',
      customerId: 'cust-105',
      customerName: 'Neha Gupta',
      customerEmail: 'neha.gupta@example.com',
      customerPhone: '+91 96543 21890',
      channel: 'Email',
      subject: 'Availability of Cargo Jeans in size 32',
      message: 'Hi there, are the Relaxed Fit Cargo Jeans (₹1,599) completely sold out? Can I pre-order them?',
      status: 'Pending',
      productId: 'prod-206',
      productName: 'Relaxed Fit Cargo Jeans',
      aiSuggestedReply: 'Hello Neha, thank you for writing in! The Relaxed Fit Cargo Jeans are currently out of stock, but we are accepting pre-orders with estimated delivery in 10 days. We can reserve a size 32 for you today.',
      replies: [],
      createdAt: '2026-10-08T08:50:00.000Z',
      updatedAt: '2026-10-08T08:50:00.000Z'
    },
    {
      id: 'ENQ-105',
      customerId: 'cust-103',
      customerName: 'Ananya Roy',
      customerEmail: 'ananya.roy@example.com',
      customerPhone: '+91 97234 56789',
      channel: 'WhatsApp',
      subject: 'Exchange policy on Floral Midi Dress',
      message: 'Can I exchange the Floral Print Summer Midi Dress (₹1,299) if the size M does not fit my sister?',
      status: 'Resolved',
      productId: 'prod-207',
      productName: 'Floral Print Summer Midi Dress',
      aiSuggestedReply: '',
      replies: [
        {
          id: 'rep-2',
          sender: 'Staff',
          message: 'Hello Ananya, yes absolutely! We offer a 7-day doorstep size exchange. Tags and original invoice must be intact.',
          timestamp: '2026-10-04T16:45:00.000Z'
        },
        {
          id: 'rep-3',
          sender: 'Customer',
          message: 'Great, thank you! Placed the order online.',
          timestamp: '2026-10-04T17:10:00.000Z'
        }
      ],
      createdAt: '2026-10-04T16:00:00.000Z',
      updatedAt: '2026-10-04T17:15:00.000Z'
    },
    {
      id: 'ENQ-106',
      customerId: 'cust-106',
      customerName: 'Arjun Kapoor',
      customerEmail: 'arjun.k@example.com',
      customerPhone: '+91 98234 99887',
      channel: 'Email',
      subject: 'Bulk discount quotation for 20 Oxford Cotton Shirts',
      message: 'We are ordering corporate executive gifts and need 20 Premium Oxford Cotton Shirts (assorted sizes M, L, XL). Can you provide a corporate discount price?',
      status: 'In Progress',
      productId: 'prod-201',
      productName: 'Premium Oxford Cotton Shirt',
      aiSuggestedReply: 'Hello Arjun, we would be delighted to assist with your corporate order! For 20 units of our Premium Oxford Cotton Shirt (normally ₹1,499 each), we can offer a 15% tier volume discount bringing the price to ₹1,274 per unit with complimentary gift box packaging.',
      replies: [
        {
          id: 'rep-4',
          sender: 'Staff',
          message: 'Prepared corporate quotation PDF with 15% discount structure and sent to Arjun.',
          timestamp: '2026-10-07T14:00:00.000Z'
        }
      ],
      createdAt: '2026-10-07T12:00:00.000Z',
      updatedAt: '2026-10-07T14:00:00.000Z'
    }
  ]
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(initialSeedData);
    return initialSeedData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      customers: parsed.customers || [],
      products: parsed.products || [],
      enquiries: parsed.enquiries || []
    };
  } catch (err) {
    console.error('Error reading database file, resetting to initial seed:', err);
    saveDatabase(initialSeedData);
    return initialSeedData;
  }
}

function saveDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// ----------------- Customers Operations -----------------

export function getCustomers(searchQuery?: string): Customer[] {
  const db = loadDatabase();
  if (!searchQuery || !searchQuery.trim()) {
    return db.customers;
  }
  const q = searchQuery.toLowerCase().trim();
  return db.customers.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q) ||
    (c.preferredCategory && c.preferredCategory.toLowerCase().includes(q)) ||
    (c.notes && c.notes.toLowerCase().includes(q))
  );
}

export function getCustomerById(id: string): Customer | undefined {
  const db = loadDatabase();
  return db.customers.find(c => c.id === id);
}

export function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'communicationHistory'>): Customer {
  const db = loadDatabase();
  const now = new Date().toISOString();
  const newCustomer: Customer = {
    ...data,
    id: `cust-${Date.now().toString().slice(-6)}`,
    communicationHistory: [],
    createdAt: now,
    updatedAt: now
  };
  db.customers.unshift(newCustomer);
  saveDatabase(db);
  return newCustomer;
}

export function updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Customer | null {
  const db = loadDatabase();
  const index = db.customers.findIndex(c => c.id === id);
  if (index === -1) return null;

  const current = db.customers[index];
  const updated: Customer = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  db.customers[index] = updated;
  saveDatabase(db);
  return updated;
}

export function deleteCustomer(id: string): boolean {
  const db = loadDatabase();
  const prevLen = db.customers.length;
  db.customers = db.customers.filter(c => c.id !== id);
  if (db.customers.length < prevLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

export function addCustomerCommunication(
  customerId: string,
  record: { type: 'enquiry' | 'reply' | 'call' | 'note'; message: string; staffName?: string }
): boolean {
  const db = loadDatabase();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return false;

  customer.communicationHistory.push({
    id: `comm-${Date.now()}`,
    date: new Date().toISOString(),
    ...record
  });
  customer.updatedAt = new Date().toISOString();
  saveDatabase(db);
  return true;
}

// ----------------- Products Operations -----------------

export function getProducts(options?: {
  category?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
  outOfStockOnly?: boolean;
  searchQuery?: string;
}): Product[] {
  const db = loadDatabase();
  let list = db.products;

  if (options?.category && options.category !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === options.category!.toLowerCase());
  }

  if (options?.maxPrice !== undefined && options.maxPrice > 0) {
    list = list.filter(p => p.price <= options.maxPrice!);
  }

  if (options?.inStockOnly) {
    list = list.filter(p => p.availableStock > 0);
  }

  if (options?.outOfStockOnly) {
    list = list.filter(p => p.availableStock === 0 || p.availabilityStatus === 'Out of Stock');
  }

  if (options?.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  return list;
}

export function getProductById(id: string): Product | undefined {
  const db = loadDatabase();
  return db.products.find(p => p.id === id);
}

export function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = loadDatabase();
  const now = new Date().toISOString();
  
  // calculate status if needed
  let status = data.availabilityStatus;
  if (data.availableStock <= 0) {
    status = 'Out of Stock';
  } else if (data.availableStock <= 8) {
    status = 'Low Stock';
  } else {
    status = 'In Stock';
  }

  const newProduct: Product = {
    ...data,
    availabilityStatus: status,
    id: `prod-${Date.now().toString().slice(-6)}`,
    createdAt: now,
    updatedAt: now
  };
  db.products.unshift(newProduct);
  saveDatabase(db);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
  const db = loadDatabase();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const current = db.products[index];
  const merged = { ...current, ...updates };

  // Adjust status based on stock count if updated
  if (updates.availableStock !== undefined) {
    if (updates.availableStock <= 0) {
      merged.availabilityStatus = 'Out of Stock';
    } else if (updates.availableStock <= 8) {
      merged.availabilityStatus = 'Low Stock';
    } else if (!updates.availabilityStatus) {
      merged.availabilityStatus = 'In Stock';
    }
  }

  merged.updatedAt = new Date().toISOString();
  db.products[index] = merged;
  saveDatabase(db);
  return merged;
}

export function deleteProduct(id: string): boolean {
  const db = loadDatabase();
  const prevLen = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  if (db.products.length < prevLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ----------------- Enquiries Operations -----------------

export function getEnquiries(options?: {
  status?: string;
  searchQuery?: string;
  customerId?: string;
  productId?: string;
}): Enquiry[] {
  const db = loadDatabase();
  let list = db.enquiries;

  if (options?.status && options.status !== 'All') {
    list = list.filter(e => e.status.toLowerCase() === options.status!.toLowerCase());
  }

  if (options?.customerId) {
    list = list.filter(e => e.customerId === options.customerId);
  }

  if (options?.productId) {
    list = list.filter(e => e.productId === options.productId);
  }

  if (options?.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    list = list.filter(e =>
      e.subject.toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q) ||
      e.customerName.toLowerCase().includes(q) ||
      e.customerEmail.toLowerCase().includes(q) ||
      (e.productName && e.productName.toLowerCase().includes(q))
    );
  }

  return list;
}

export function getEnquiryById(id: string): Enquiry | undefined {
  const db = loadDatabase();
  return db.enquiries.find(e => e.id === id);
}

export function createEnquiry(data: Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Enquiry {
  const db = loadDatabase();
  const now = new Date().toISOString();
  
  // Link to existing customer or create one if email matches
  let customerId = data.customerId;
  if (!customerId && data.customerEmail) {
    const existing = db.customers.find(c => c.email.toLowerCase() === data.customerEmail.toLowerCase());
    if (existing) {
      customerId = existing.id;
    }
  }

  const newEnquiry: Enquiry = {
    ...data,
    customerId,
    id: `ENQ-${Math.floor(100 + Math.random() * 900)}`,
    replies: [],
    createdAt: now,
    updatedAt: now
  };

  db.enquiries.unshift(newEnquiry);
  saveDatabase(db);

  // Also log in customer communication history if customer exists
  if (customerId) {
    addCustomerCommunication(customerId, {
      type: 'enquiry',
      message: `${newEnquiry.subject}: ${newEnquiry.message}`
    });
  }

  return newEnquiry;
}

export function updateEnquiry(id: string, updates: Partial<Omit<Enquiry, 'id' | 'createdAt'>>): Enquiry | null {
  const db = loadDatabase();
  const index = db.enquiries.findIndex(e => e.id === id);
  if (index === -1) return null;

  const current = db.enquiries[index];
  const updated: Enquiry = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  db.enquiries[index] = updated;
  saveDatabase(db);
  return updated;
}

export function deleteEnquiry(id: string): boolean {
  const db = loadDatabase();
  const prevLen = db.enquiries.length;
  db.enquiries = db.enquiries.filter(e => e.id !== id);
  if (db.enquiries.length < prevLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

export function addEnquiryReply(
  enquiryId: string,
  reply: { sender: 'Staff' | 'AI Assistant' | 'Customer'; message: string; sentViaGmail?: boolean }
): Enquiry | null {
  const db = loadDatabase();
  const enquiry = db.enquiries.find(e => e.id === enquiryId);
  if (!enquiry) return null;

  const newReply = {
    id: `rep-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...reply
  };

  enquiry.replies.push(newReply);
  if (enquiry.status === 'Pending') {
    enquiry.status = 'In Progress';
  }
  enquiry.updatedAt = new Date().toISOString();
  saveDatabase(db);

  // If customer is linked, append to communication history
  if (enquiry.customerId) {
    addCustomerCommunication(enquiry.customerId, {
      type: 'reply',
      message: `[Re: ${enquiry.subject}] ${reply.message}`,
      staffName: reply.sender
    });
  }

  return enquiry;
}

// ----------------- Dashboard Statistics -----------------

export function getDashboardStats(): DashboardStats {
  const db = loadDatabase();
  
  const pendingEnquiries = db.enquiries.filter(e => e.status === 'Pending').length;
  const inProgressEnquiries = db.enquiries.filter(e => e.status === 'In Progress').length;
  const resolvedEnquiries = db.enquiries.filter(e => e.status === 'Resolved').length;

  const outOfStockProducts = db.products.filter(p => p.availableStock === 0 || p.availabilityStatus === 'Out of Stock').length;
  const lowStockProducts = db.products.filter(p => p.availableStock > 0 && p.availableStock <= 8).length;

  const categoryBreakdown: Record<string, number> = {};
  db.products.forEach(p => {
    categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
  });

  return {
    totalCustomers: db.customers.length,
    totalProducts: db.products.length,
    pendingEnquiries,
    inProgressEnquiries,
    resolvedEnquiries,
    outOfStockProducts,
    lowStockProducts,
    categoryBreakdown,
    statusBreakdown: {
      pending: pendingEnquiries,
      inProgress: inProgressEnquiries,
      resolved: resolvedEnquiries
    }
  };
}
