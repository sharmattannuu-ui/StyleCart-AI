import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  addEnquiryReply,
  getDashboardStats
} from './server/db.js';
import { processAgentChat } from './server/aiAgent.js';
import { fetchGmailMessages, sendGmailEmail, verifyGmailToken } from './server/gmail.js';
import {
  saveOAuthSession,
  loadOAuthSession,
  clearOAuthSession,
  getEffectiveAccessToken
} from './server/oauthStore.js';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // ----------------- Customers Endpoints -----------------

  app.get('/api/customers', (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const customers = getCustomers(q);
      res.json({ success: true, data: customers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/customers/:id', (req, res) => {
    try {
      const customer = getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      res.json({ success: true, data: customer });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/customers', (req, res) => {
    try {
      const { name, email, phone, preferredCategory, notes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Customer name is required' });
      }
      if (!email || !email.trim() || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Valid customer email is required' });
      }
      if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, error: 'Customer phone number is required' });
      }

      const created = createCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredCategory: preferredCategory || 'Shirts',
        notes: notes || ''
      });
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/customers/:id', (req, res) => {
    try {
      const updated = updateCustomer(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/customers/:id', (req, res) => {
    try {
      const success = deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- Products Endpoints -----------------

  app.get('/api/products', (req, res) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const inStockOnly = req.query.inStockOnly === 'true';
      const outOfStockOnly = req.query.outOfStockOnly === 'true';
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;

      const products = getProducts({ category, maxPrice, inStockOnly, outOfStockOnly, searchQuery: q });
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    try {
      const product = getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/products', (req, res) => {
    try {
      const { name, category, description, price, availableStock, sizes, imageUrl } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Product name is required' });
      }
      if (!category) {
        return res.status(400).json({ success: false, error: 'Product category is required' });
      }
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, error: 'Valid price in INR is required' });
      }
      const numStock = parseInt(availableStock ?? 0, 10);
      if (isNaN(numStock) || numStock < 0) {
        return res.status(400).json({ success: false, error: 'Valid stock quantity is required' });
      }

      const created = createProduct({
        name: name.trim(),
        category,
        description: description?.trim() || '',
        price: numPrice,
        availableStock: numStock,
        availabilityStatus: numStock <= 0 ? 'Out of Stock' : numStock <= 8 ? 'Low Stock' : 'In Stock',
        sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
        imageUrl: imageUrl || ''
      });
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      const updated = updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    try {
      const success = deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- Enquiries Endpoints -----------------

  app.get('/api/enquiries', (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
      const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;

      const enquiries = getEnquiries({ status, searchQuery: q, customerId, productId });
      res.json({ success: true, data: enquiries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/enquiries/:id', (req, res) => {
    try {
      const enquiry = getEnquiryById(req.params.id);
      if (!enquiry) {
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
      }
      res.json({ success: true, data: enquiry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/enquiries', (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, channel, subject, message, productId, productName } = req.body;
      if (!customerName || !customerName.trim()) {
        return res.status(400).json({ success: false, error: 'Customer name is required' });
      }
      if (!customerEmail || !customerEmail.trim()) {
        return res.status(400).json({ success: false, error: 'Customer email is required' });
      }
      if (!subject || !subject.trim()) {
        return res.status(400).json({ success: false, error: 'Enquiry subject is required' });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Enquiry message is required' });
      }

      const created = createEnquiry({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone?.trim() || '',
        channel: channel || 'Email',
        subject: subject.trim(),
        message: message.trim(),
        status: 'Pending',
        productId,
        productName
      });
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/enquiries/:id', (req, res) => {
    try {
      const updated = updateEnquiry(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/enquiries/:id', (req, res) => {
    try {
      const success = deleteEnquiry(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
      }
      res.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/enquiries/:id/reply', (req, res) => {
    try {
      const { message, sender, sentViaGmail } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Reply message cannot be empty' });
      }

      const updated = addEnquiryReply(req.params.id, {
        message: message.trim(),
        sender: sender || 'Staff',
        sentViaGmail: !!sentViaGmail
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Draft Reply generation for a specific enquiry
  app.post('/api/enquiries/:id/generate-ai-draft', async (req, res) => {
    try {
      const enquiry = getEnquiryById(req.params.id);
      if (!enquiry) {
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
      }

      const product = enquiry.productId ? getProductById(enquiry.productId) : undefined;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          draft: `Hello ${enquiry.customerName}, thank you for reaching out to StyleCart! We have received your query regarding "${enquiry.subject}" and our team is happy to assist you.`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `
You are the polite customer relations manager for StyleCart AI, a premium clothing store.
Customer Name: ${enquiry.customerName}
Subject: ${enquiry.subject}
Customer's Enquiry: "${enquiry.message}"
Product context: ${product ? `Name: ${product.name}, Price: ₹${product.price}, Category: ${product.category}, Stock: ${product.availableStock} (${product.availabilityStatus})` : 'General enquiry'}
Store Policy: 7-day hassle-free exchange with tags, free shipping over ₹999.

Draft a warm, polite, professional, and clear reply to the customer addressing their question directly. Reference accurate inventory numbers and prices (in INR ₹).
Keep it concise, friendly, and signed off as "StyleCart Sales Team".
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      const draft = response.text || '';
      updateEnquiry(enquiry.id, { aiSuggestedReply: draft });

      res.json({ success: true, draft });
    } catch (err: any) {
      console.error('Error generating AI draft:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- Dashboard Stats -----------------

  app.get('/api/dashboard/stats', (req, res) => {
    try {
      const stats = getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- AI Sales Agent Chat -----------------

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      // Check for token from header OR stored server session
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const gmailAccessToken = (await getEffectiveAccessToken(headerToken)) || undefined;

      const result = await processAgentChat({
        message: message.trim(),
        history,
        gmailAccessToken
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error('AI Agent Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error processing AI sales assistant request'
      });
    }
  });

  // Confirmation endpoint for consequential actions proposed by AI Agent
  app.post('/api/ai/confirm-action', async (req, res) => {
    try {
      const { actionType, payload } = req.body;
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const gmailAccessToken = await getEffectiveAccessToken(headerToken);

      if (actionType === 'send_email') {
        if (!gmailAccessToken) {
          return res.status(401).json({
            success: false,
            error: 'Cannot send email: Google account with Gmail permission is not connected.'
          });
        }
        const { to, subject, body, enquiryId } = payload;
        await sendGmailEmail(gmailAccessToken, to, subject, body);

        if (enquiryId) {
          addEnquiryReply(enquiryId, {
            sender: 'AI Assistant',
            message: `[Email Sent to ${to}] ${body}`,
            sentViaGmail: true
          });
        }
        return res.json({ success: true, message: `Email sent to ${to} via Gmail successfully.` });
      }

      if (actionType === 'delete_customer') {
        const success = deleteCustomer(payload.id);
        return res.json({ success, message: success ? 'Customer deleted.' : 'Customer not found.' });
      }

      if (actionType === 'delete_product') {
        const success = deleteProduct(payload.id);
        return res.json({ success, message: success ? 'Product deleted.' : 'Product not found.' });
      }

      if (actionType === 'delete_enquiry') {
        const success = deleteEnquiry(payload.id);
        return res.json({ success, message: success ? 'Enquiry deleted.' : 'Enquiry not found.' });
      }

      if (actionType === 'mark_resolved') {
        const updated = updateEnquiry(payload.enquiryId, { status: 'Resolved' });
        return res.json({ success: !!updated, message: updated ? 'Enquiry marked as Resolved.' : 'Enquiry not found.' });
      }

      res.status(400).json({ success: false, error: 'Unknown action type' });
    } catch (err: any) {
      console.error('Action Confirmation Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- Gmail Endpoints -----------------

  // Save OAuth session securely on the server
  app.post('/api/gmail/auth-session', async (req, res) => {
    try {
      const { accessToken, email, name, photoUrl } = req.body;
      if (!accessToken || typeof accessToken !== 'string') {
        return res.status(400).json({ success: false, error: 'Access token is required' });
      }

      // Verify the token with Gmail API to ensure it has valid scopes and is live
      const verification = await verifyGmailToken(accessToken);
      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: verification.error || 'Provided Google token failed Gmail authorization verification.'
        });
      }

      const verifiedEmail = verification.emailAddress || email || 'authorized-user@gmail.com';
      const session = saveOAuthSession({
        accessToken,
        userEmail: verifiedEmail,
        userName: name,
        userPhotoUrl: photoUrl
      });

      // Do NOT expose the access token in the response
      res.json({
        success: true,
        data: {
          connected: true,
          userEmail: session.userEmail,
          userName: session.userName,
          userPhotoUrl: session.userPhotoUrl,
          connectedAt: session.connectedAt
        }
      });
    } catch (err: any) {
      console.error('Save OAuth session error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Check persistent connection status on app load or refresh
  app.get('/api/gmail/status', async (req, res) => {
    try {
      const session = loadOAuthSession();
      if (!session) {
        return res.json({
          success: true,
          data: {
            connected: false
          }
        });
      }

      // Verify the token is still authorized with Gmail API
      const verification = await verifyGmailToken(session.accessToken);
      if (!verification.valid) {
        return res.json({
          success: true,
          data: {
            connected: false,
            expired: true,
            userEmail: session.userEmail,
            error: 'Google authorization has expired or was revoked. Please reconnect.'
          }
        });
      }

      // Return connection metadata safely WITHOUT exposing accessToken
      res.json({
        success: true,
        data: {
          connected: true,
          userEmail: verification.emailAddress || session.userEmail,
          userName: session.userName,
          userPhotoUrl: session.userPhotoUrl,
          connectedAt: session.connectedAt
        }
      });
    } catch (err: any) {
      console.error('Gmail status error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Disconnect Gmail session on server
  app.post('/api/gmail/disconnect', (req, res) => {
    try {
      clearOAuthSession();
      res.json({ success: true, message: 'Gmail disconnected successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/gmail/messages', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const token = await getEffectiveAccessToken(headerToken);

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Please sign in with Google to view customer enquiry emails.'
        });
      }

      const query = typeof req.query.q === 'string' ? req.query.q : '';
      const messages = await fetchGmailMessages(token, query);

      // Check which emails are already imported as enquiries
      const allEnquiries = getEnquiries();
      const existingEmails = new Set(allEnquiries.map(e => e.customerEmail.toLowerCase()));

      const enriched = messages.map(m => ({
        ...m,
        isImported: existingEmails.has(m.senderEmail.toLowerCase())
      }));

      res.json({ success: true, data: enriched });
    } catch (err: any) {
      console.error('Gmail messages error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch messages from Gmail API'
      });
    }
  });

  app.post('/api/gmail/import', async (req, res) => {
    try {
      const { senderName, senderEmail, subject, body, snippet } = req.body;
      if (!senderEmail) {
        return res.status(400).json({ success: false, error: 'Sender email is required' });
      }

      const content = body || snippet || '(Empty email message)';
      const enquiry = createEnquiry({
        customerName: senderName || 'Gmail Customer',
        customerEmail: senderEmail,
        channel: 'Email',
        subject: subject || 'Customer Enquiry via Gmail',
        message: content.slice(0, 1500),
        status: 'Pending'
      });

      res.status(201).json({ success: true, data: enquiry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/gmail/send-reply', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const token = await getEffectiveAccessToken(headerToken);

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Sign in with Google is required to send emails via Gmail.'
        });
      }

      const { to, subject, body, enquiryId } = req.body;

      if (!to || !body) {
        return res.status(400).json({ success: false, error: 'Recipient and message body are required' });
      }

      const result = await sendGmailEmail(token, to, subject || 'Re: StyleCart Enquiry', body);

      if (enquiryId) {
        addEnquiryReply(enquiryId, {
          sender: 'Staff',
          message: body,
          sentViaGmail: true
        });
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('Error sending reply via Gmail:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- Vite Middleware & Production Serving -----------------

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StyleCart AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
