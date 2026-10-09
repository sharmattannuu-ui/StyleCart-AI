import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import {
  getCustomers,
  getCustomerById,
  getProducts,
  getProductById,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  deleteCustomer,
  deleteProduct,
  addEnquiryReply,
  getDashboardStats
} from './db.js';
import { fetchGmailMessages } from './gmail.js';
import { AgentActionProposal } from '../src/types/index.js';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Function Declarations for Gemini Tools
const queryEnquiriesDeclaration: FunctionDeclaration = {
  name: 'queryEnquiries',
  description: 'Search and filter store enquiries from customers. Can filter by status (Pending, In Progress, Resolved) or query terms like product name, keyword, or jeans.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        description: 'Filter by status: "Pending", "In Progress", "Resolved", or "All"'
      },
      searchQuery: {
        type: Type.STRING,
        description: 'Search text like "jeans", "cotton shirt", "discount", or customer name'
      }
    }
  }
};

const queryProductsDeclaration: FunctionDeclaration = {
  name: 'queryProducts',
  description: 'Search clothing inventory and products. Can filter by maximum price in INR (e.g. 1000), category (Shirts, Jeans, Dresses, Jackets), or stock status (in stock vs out of stock).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      maxPrice: {
        type: Type.NUMBER,
        description: 'Maximum price in Indian Rupees (INR ₹), e.g. 1000 for products under ₹1,000'
      },
      category: {
        type: Type.STRING,
        description: 'Product category: "Shirts", "Jeans", "Dresses", "Jackets", "Accessories", "Activewear", or "All"'
      },
      outOfStockOnly: {
        type: Type.BOOLEAN,
        description: 'Set to true to find products that are currently out of stock (availableStock = 0)'
      },
      inStockOnly: {
        type: Type.BOOLEAN,
        description: 'Set to true to find products that are currently in stock'
      },
      searchQuery: {
        type: Type.STRING,
        description: 'Search term for product name or description'
      }
    }
  }
};

const queryCustomersDeclaration: FunctionDeclaration = {
  name: 'queryCustomers',
  description: 'Search store customers. Can search by name, email, phone, or find customers who have not received a response to their enquiries.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchQuery: {
        type: Type.STRING,
        description: 'Search text for customer name, email, phone, or preferred category'
      },
      unrespondedOnly: {
        type: Type.BOOLEAN,
        description: 'Set to true to specifically find customers who have pending enquiries with zero replies/response'
      }
    }
  }
};

const draftReplyDeclaration: FunctionDeclaration = {
  name: 'draftReply',
  description: 'Draft a polite, professional customer service reply to a customer enquiry, incorporating real product stock, pricing in INR, and helpful store recommendations.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      enquiryId: {
        type: Type.STRING,
        description: 'The enquiry ID (e.g. "ENQ-101", "ENQ-102") to draft a reply for'
      },
      customTone: {
        type: Type.STRING,
        description: 'Optional tone instructions (e.g. "friendly", "formal", "reassuring")'
      }
    },
    required: ['enquiryId']
  }
};

const markEnquiryResolvedDeclaration: FunctionDeclaration = {
  name: 'markEnquiryResolved',
  description: 'Mark a specific enquiry as Resolved in the database when explicitly requested by the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      enquiryId: {
        type: Type.STRING,
        description: 'The enquiry ID to mark as resolved (e.g. "ENQ-101")'
      }
    },
    required: ['enquiryId']
  }
};

const proposeActionDeclaration: FunctionDeclaration = {
  name: 'proposeAction',
  description: 'Propose a consequential action (such as sending an email to a customer or deleting a record) that requires user confirmation in the UI before execution.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      actionType: {
        type: Type.STRING,
        description: 'One of: "send_email", "delete_customer", "delete_product", "delete_enquiry", "mark_resolved"'
      },
      title: {
        type: Type.STRING,
        description: 'Short headline of the action, e.g. "Send email reply to Priya Sharma"'
      },
      description: {
        type: Type.STRING,
        description: 'Detailed explanation of what will happen upon confirmation'
      },
      payload: {
        type: Type.OBJECT,
        description: 'Required data parameters for the action (e.g. enquiryId, recipientEmail, subject, body)'
      }
    },
    required: ['actionType', 'title', 'description', 'payload']
  }
};

const scanGmailDeclaration: FunctionDeclaration = {
  name: 'scanGmail',
  description: 'Access the authorized user\'s Gmail to find recent incoming customer enquiry emails.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchQuery: {
        type: Type.STRING,
        description: 'Specific Gmail query, e.g. "clothing", "order", "size", or leave empty'
      }
    }
  }
};

const toolDeclarations = [
  queryEnquiriesDeclaration,
  queryProductsDeclaration,
  queryCustomersDeclaration,
  draftReplyDeclaration,
  markEnquiryResolvedDeclaration,
  proposeActionDeclaration,
  scanGmailDeclaration
];

// Direct backend tool execution fallback when Gemini quota/rate limits occur
function executeDirectFallback(message: string): {
  reply: string;
  toolInvocations: Array<{ toolName: string; params: any; resultSummary: string }>;
  proposal?: AgentActionProposal;
} {
  const lower = message.toLowerCase();
  const toolInvocations: Array<{ toolName: string; params: any; resultSummary: string }> = [];

  // 1. Pending enquiries
  if (lower.includes('pending') || (lower.includes('show') && lower.includes('enquir'))) {
    const list = getEnquiries({ status: 'Pending' });
    toolInvocations.push({
      toolName: 'queryEnquiries',
      params: { status: 'Pending' },
      resultSummary: `Retrieved ${list.length} pending enquiries from database`
    });

    if (list.length === 0) {
      return {
        reply: `There are currently **no pending enquiries** in the database. All customer enquiries have been answered or resolved!`,
        toolInvocations
      };
    }

    const items = list.map(e => `• **${e.id}** (${e.customerName} via ${e.channel}): "${e.subject}"\n  *Message:* ${e.message}`).join('\n\n');
    return {
      reply: `Here are all **${list.length} pending sales enquiries** awaiting a response:\n\n${items}`,
      toolInvocations
    };
  }

  // 2. Customers asked about jeans
  if (lower.includes('jeans')) {
    const jeansEnqs = getEnquiries({ searchQuery: 'jeans' });
    toolInvocations.push({
      toolName: 'queryEnquiries',
      params: { searchQuery: 'jeans' },
      resultSummary: `Found ${jeansEnqs.length} enquiries discussing jeans`
    });

    if (jeansEnqs.length === 0) {
      return {
        reply: `No customer enquiries specifically mentioned jeans in the current database.`,
        toolInvocations
      };
    }

    const details = jeansEnqs.map(e => `• **${e.customerName}** (${e.customerEmail}, ${e.customerPhone || 'No phone'})\n  *Enquiry ${e.id}:* "${e.subject}"\n  *Details:* ${e.message}\n  *Status:* ${e.status}`).join('\n\n');
    return {
      reply: `The following **${jeansEnqs.length} customer(s)** have asked about jeans:\n\n${details}`,
      toolInvocations
    };
  }

  // 3. Products priced below ₹1,000
  if (lower.includes('below') || lower.includes('under') || lower.includes('1000') || lower.includes('1,000')) {
    const prods = getProducts({ maxPrice: 1000 });
    toolInvocations.push({
      toolName: 'queryProducts',
      params: { maxPrice: 1000 },
      resultSummary: `Found ${prods.length} products with price <= ₹1,000`
    });

    const items = prods.map(p => `• **${p.name}** — **₹${p.price.toLocaleString('en-IN')}** (${p.category})\n  *Stock:* ${p.availableStock} units (${p.availabilityStatus})\n  *Description:* ${p.description}`).join('\n\n');
    return {
      reply: `Here are all clothing products priced **below ₹1,000** in store inventory:\n\n${items}`,
      toolInvocations
    };
  }

  // 4. Products out of stock
  if (lower.includes('out of stock') || lower.includes('sold out')) {
    const oos = getProducts({ outOfStockOnly: true });
    toolInvocations.push({
      toolName: 'queryProducts',
      params: { outOfStockOnly: true },
      resultSummary: `Retrieved ${oos.length} out of stock products`
    });

    if (oos.length === 0) {
      return {
        reply: `Great news! All products in the store currently have inventory in stock.`,
        toolInvocations
      };
    }

    const items = oos.map(p => `• **${p.name}** (₹${p.price.toLocaleString('en-IN')}) — ${p.category}\n  *Available Stock:* 0 units\n  *Sizes normally carried:* ${p.sizes?.join(', ')}`).join('\n\n');
    return {
      reply: `The following **${oos.length} products** are currently **out of stock**:\n\n${items}\n\n*Recommendation:* You may wish to contact your suppliers to restock these trending items.`,
      toolInvocations
    };
  }

  // 5. Customers who have not received a response
  if (lower.includes('not received') || lower.includes('unresponded') || lower.includes('no response') || lower.includes('response')) {
    const pendingEnqs = getEnquiries({ status: 'Pending' });
    const unresponded = pendingEnqs.filter(e => e.replies.length === 0);
    toolInvocations.push({
      toolName: 'queryCustomers',
      params: { unrespondedOnly: true },
      resultSummary: `Found ${unresponded.length} customers with pending enquiries and 0 replies`
    });

    if (unresponded.length === 0) {
      return {
        reply: `All customers have received at least one response to their enquiries!`,
        toolInvocations
      };
    }

    const items = unresponded.map(e => `• **${e.customerName}** (${e.customerEmail}, ${e.customerPhone || 'N/A'})\n  *Awaiting answer on enquiry ${e.id}:* "${e.subject}"\n  *Received on:* ${new Date(e.createdAt).toLocaleDateString('en-IN')}`).join('\n\n');
    return {
      reply: `Here are the **${unresponded.length} customers** who have not yet received any reply to their enquiries:\n\n${items}\n\nWould you like me to draft a polite reply for any of these enquiries?`,
      toolInvocations
    };
  }

  // 6. Draft a reply
  if (lower.includes('draft') || lower.includes('polite reply')) {
    const match = message.match(/ENQ-\d+/i);
    const enquiryId = match ? match[0].toUpperCase() : 'ENQ-101';
    const enquiry = getEnquiryById(enquiryId);

    if (!enquiry) {
      return {
        reply: `Could not find enquiry with ID **${enquiryId}**. Please provide a valid enquiry ID such as ENQ-101 or ENQ-102.`,
        toolInvocations
      };
    }

    const product = enquiry.productId ? getProductById(enquiry.productId) : undefined;
    toolInvocations.push({
      toolName: 'draftReply',
      params: { enquiryId },
      resultSummary: `Generated reply draft for ${enquiry.id} referencing inventory`
    });

    let draftContent = `Hello ${enquiry.customerName},\n\nThank you for reaching out to StyleCart AI! `;
    if (product) {
      if (product.availableStock === 0) {
        draftContent += `Regarding your interest in the ${product.name} (₹${product.price.toLocaleString('en-IN')}), it is currently out of stock. We have a restock scheduled shortly, and we would be delighted to reserve your preferred size as soon as it arrives!`;
      } else {
        draftContent += `Regarding the ${product.name} (₹${product.price.toLocaleString('en-IN')}), we currently have ${product.availableStock} units available in stock in sizes ${product.sizes?.join(', ')}. We also provide free delivery on orders over ₹999 and a 7-day hassle-free exchange!`;
      }
    } else {
      draftContent += `We have received your question regarding "${enquiry.subject}". Our store team is actively checking this for you and we are happy to assist with any sizing or styling recommendations!`;
    }
    draftContent += `\n\nPlease let us know if you need any additional assistance.\n\nWarm regards,\nStyleCart Sales Team`;

    const proposal: AgentActionProposal = {
      actionId: `act-${Date.now()}`,
      actionType: 'send_email',
      title: `Send drafted email reply to ${enquiry.customerName}`,
      description: `Send this polite reply to ${enquiry.customerEmail} for enquiry ${enquiry.id}.`,
      payload: {
        to: enquiry.customerEmail,
        subject: `Re: ${enquiry.subject}`,
        body: draftContent,
        enquiryId: enquiry.id
      }
    };

    return {
      reply: `Here is a drafted polite reply for **${enquiry.customerName}** regarding **${enquiry.subject}**:\n\n---\n${draftContent}\n---\n\n*Safety Check:* Since sending an email is a consequential action, please review the confirmation card below before dispatching.`,
      toolInvocations,
      proposal
    };
  }

  // 7. Mark enquiry as resolved
  if (lower.includes('mark') && lower.includes('resolved')) {
    const match = message.match(/ENQ-\d+/i);
    const enquiryId = match ? match[0].toUpperCase() : 'ENQ-101';
    const enquiry = getEnquiryById(enquiryId);

    if (!enquiry) {
      return {
        reply: `Could not find enquiry **${enquiryId}** to mark as resolved.`,
        toolInvocations
      };
    }

    const updated = updateEnquiry(enquiryId, { status: 'Resolved' });
    toolInvocations.push({
      toolName: 'markEnquiryResolved',
      params: { enquiryId },
      resultSummary: `Updated status of ${enquiryId} to Resolved`
    });

    return {
      reply: `✅ Successfully marked enquiry **${enquiryId}** (${enquiry.customerName}: "${enquiry.subject}") as **Resolved** in the database.`,
      toolInvocations
    };
  }

  // Default general overview
  const stats = getDashboardStats();
  return {
    reply: `I have checked the StyleCart store database:\n• **Customers:** ${stats.totalCustomers} records\n• **Clothing Products:** ${stats.totalProducts} items\n• **Pending Enquiries:** ${stats.pendingEnquiries} requests\n• **Resolved Enquiries:** ${stats.resolvedEnquiries} closed\n• **Out of Stock:** ${stats.outOfStockProducts} items\n\nYou can ask me to show pending enquiries, find products under ₹1,000, check jeans, draft customer replies, or mark enquiries as resolved!`,
    toolInvocations
  };
}

export async function processAgentChat(params: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  gmailAccessToken?: string;
}): Promise<{
  reply: string;
  toolInvocations: Array<{ toolName: string; params: any; resultSummary: string }>;
  proposal?: AgentActionProposal;
}> {
  const toolInvocations: Array<{ toolName: string; params: any; resultSummary: string }> = [];
  let pendingProposal: AgentActionProposal | undefined = undefined;

  try {
    const ai = getAiClient();

    const systemInstruction = `
You are the AI Sales Assistant for "StyleCart AI", a modern clothing and apparel boutique.
Your job is to assist the store manager by retrieving accurate real-time inventory, handling customer CRM, managing sales enquiries, drafting polite customer replies, and syncing Gmail enquiries.

CRITICAL INSTRUCTIONS:
1. Always use the provided tool declarations to fetch or update actual database records. Do NOT hallucinate product prices, stock numbers, or customer names.
2. Store currency is always Indian Rupees (INR ₹). Formatted examples: ₹699, ₹999, ₹1,499.
3. When asked to "Show pending enquiries", call queryEnquiries({ status: "Pending" }).
4. When asked "Which customers asked about jeans?", call queryEnquiries({ searchQuery: "jeans" }) or queryCustomers.
5. When asked "Find products priced below ₹1,000", call queryProducts({ maxPrice: 1000 }).
6. When asked "Which products are out of stock?", call queryProducts({ outOfStockOnly: true }).
7. When asked "Find customers who have not received a response", call queryCustomers({ unrespondedOnly: true }).
8. When asked to draft a polite reply, call draftReply({ enquiryId }).
9. When explicitly requested to "Mark enquiry as resolved", call markEnquiryResolved({ enquiryId }).
10. Consequential actions (such as sending an email to an external customer or deleting a customer/product/enquiry) MUST ALWAYS use the proposeAction tool to ask for user confirmation first. Never silently execute destructive operations!
11. Present all answers clearly, professionally, and warmly with bullet points or formatted summaries.
`;

    // Format contents for Gemini
    const contents: any[] = [];
    if (params.history && params.history.length > 0) {
      for (const h of params.history.slice(-8)) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: params.message }]
    });

    // Turn 1: Generate content with tools
    const firstResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }]
      }
    });

    const functionCalls = firstResponse.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      return {
        reply: firstResponse.text || 'I have checked your request. How else may I assist with your clothing store?',
        toolInvocations,
        proposal: pendingProposal
      };
    }

    // Execute all function calls against actual database
    const toolResultsParts: any[] = [];

    for (const call of functionCalls) {
      const fnName: string = call.name || 'unknown_tool';
      const args = (call.args || {}) as Record<string, any>;

      let resultData: any = {};
      let summary = '';

      try {
        if (fnName === 'queryEnquiries') {
          const enquiries = getEnquiries({
            status: args.status,
            searchQuery: args.searchQuery
          });
          resultData = { count: enquiries.length, enquiries };
          summary = `Retrieved ${enquiries.length} enquiries (Status: ${args.status || 'All'}, Query: "${args.searchQuery || ''}")`;
        } else if (fnName === 'queryProducts') {
          const products = getProducts({
            maxPrice: args.maxPrice,
            category: args.category,
            outOfStockOnly: args.outOfStockOnly,
            inStockOnly: args.inStockOnly,
            searchQuery: args.searchQuery
          });
          resultData = { count: products.length, products };
          summary = `Retrieved ${products.length} products (MaxPrice: ${args.maxPrice ? '₹' + args.maxPrice : 'None'}, OutOfStockOnly: ${args.outOfStockOnly || false})`;
        } else if (fnName === 'queryCustomers') {
          let customers = getCustomers(args.searchQuery);
          if (args.unrespondedOnly) {
            const pendingEnqs = getEnquiries({ status: 'Pending' });
            const unrespondedEmails = new Set(
              pendingEnqs
                .filter(e => e.replies.length === 0)
                .map(e => e.customerEmail.toLowerCase())
            );
            customers = customers.filter(c => unrespondedEmails.has(c.email.toLowerCase()));
          }
          resultData = { count: customers.length, customers };
          summary = `Found ${customers.length} customers (Unresponded only: ${args.unrespondedOnly || false})`;
        } else if (fnName === 'draftReply') {
          const enquiry = getEnquiryById(args.enquiryId);
          if (!enquiry) {
            resultData = { error: `Enquiry with ID ${args.enquiryId} not found.` };
            summary = `Enquiry not found: ${args.enquiryId}`;
          } else {
            const product = enquiry.productId ? getProductById(enquiry.productId) : undefined;
            resultData = {
              enquiry,
              product,
              storeContext: {
                storeName: 'StyleCart AI',
                exchangePolicy: '7-day doorstep size exchange with original tags',
                shippingPolicy: 'Free shipping across India on orders above ₹999'
              }
            };
            summary = `Drafted reply context for ${enquiry.id} (${enquiry.customerName})`;
          }
        } else if (fnName === 'markEnquiryResolved') {
          const updated = updateEnquiry(args.enquiryId, { status: 'Resolved' });
          if (updated) {
            resultData = { success: true, enquiry: updated };
            summary = `Marked enquiry ${args.enquiryId} as Resolved in database.`;
          } else {
            resultData = { error: `Enquiry ${args.enquiryId} not found.` };
            summary = `Failed to resolve: Enquiry ${args.enquiryId} not found.`;
          }
        } else if (fnName === 'proposeAction') {
          pendingProposal = {
            actionId: `act-${Date.now()}`,
            actionType: args.actionType,
            title: args.title,
            description: args.description,
            payload: args.payload
          };
          resultData = {
            proposalCreated: true,
            actionId: pendingProposal.actionId,
            status: 'Awaiting explicit user confirmation in UI'
          };
          summary = `Created confirmation proposal: "${args.title}"`;
        } else if (fnName === 'scanGmail') {
          if (!params.gmailAccessToken) {
            resultData = {
              error: 'Gmail is not connected. User needs to sign in with Google in the UI to permit Gmail access.'
            };
            summary = 'Gmail not connected - authentication required';
          } else {
            try {
              const emails = await fetchGmailMessages(params.gmailAccessToken, args.searchQuery);
              resultData = { count: emails.length, emails };
              summary = `Scanned Gmail inbox: found ${emails.length} relevant messages`;
            } catch (e: any) {
              resultData = { error: `Gmail scan error: ${e.message}` };
              summary = `Gmail error: ${e.message}`;
            }
          }
        }

        toolInvocations.push({
          toolName: fnName,
          params: args,
          resultSummary: summary
        });

        toolResultsParts.push({
          functionResponse: {
            name: fnName,
            response: { result: resultData }
          }
        });
      } catch (err: any) {
        console.error(`Error executing tool ${fnName}:`, err);
        toolResultsParts.push({
          functionResponse: {
            name: fnName,
            response: { error: err.message || 'Tool execution error' }
          }
        });
      }
    }

    // Turn 2: Provide the tool results back to Gemini to synthesize natural response
    const modelCandidateContent = firstResponse.candidates?.[0]?.content;
    const turn2Contents = [
      ...contents,
      modelCandidateContent || { role: 'model', parts: [{ text: 'Calling tools...' }] },
      {
        role: 'user',
        parts: toolResultsParts
      }
    ];

    const finalResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: turn2Contents,
      config: {
        systemInstruction
      }
    });

    return {
      reply: finalResponse.text || 'I have completed your request using live store records.',
      toolInvocations,
      proposal: pendingProposal
    };
  } catch (apiError: any) {
    console.warn('Gemini API call encountered error (falling back to direct database tool execution):', apiError.message);
    // Execute direct tool logic based on actual database records
    return executeDirectFallback(params.message);
  }
}
