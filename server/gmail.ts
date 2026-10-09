import { GmailEmail } from '../src/types/index.js';

interface HeaderItem {
  name: string;
  value: string;
}

function parseEmailHeaders(headers: HeaderItem[]) {
  let from = '';
  let subject = '(No Subject)';
  let date = '';
  let senderName = '';
  let senderEmail = '';

  for (const h of headers) {
    const lower = h.name.toLowerCase();
    if (lower === 'from') {
      from = h.value;
      const match = h.value.match(/^(.*?)\s*<(.+?)>$/);
      if (match) {
        senderName = match[1].replace(/["']/g, '').trim();
        senderEmail = match[2].trim();
      } else {
        senderName = h.value.split('@')[0];
        senderEmail = h.value.trim();
      }
    } else if (lower === 'subject') {
      subject = h.value;
    } else if (lower === 'date') {
      date = h.value;
    }
  }

  return { from, subject, date, senderName: senderName || 'Customer', senderEmail: senderEmail || from };
}

function decodeBase64Url(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBodyFromPayload(part);
        if (nested) return nested;
      }
    }
  }
  return '';
}

export async function fetchGmailMessages(accessToken: string, query = ''): Promise<GmailEmail[]> {
  const searchQuery = query.trim() || 'clothing OR dress OR shirt OR jeans OR order OR jacket OR stylecart OR price OR discount OR size';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent(searchQuery)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    // If specific query returned 0, try fetching standard recent inbox messages
    if (res.status === 400 || res.status === 404) {
      const fallbackUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!fallbackRes.ok) {
        throw new Error(`Gmail API error (${res.status}): ${errorText}`);
      }
      const data = await fallbackRes.json();
      return processMessageList(data.messages || [], accessToken);
    }
    throw new Error(`Gmail API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const messages = data.messages || [];

  if (messages.length === 0) {
    // If no filtered messages, fetch top 8 latest messages from inbox
    const allRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (allRes.ok) {
      const allData = await allRes.json();
      return processMessageList(allData.messages || [], accessToken);
    }
    return [];
  }

  return processMessageList(messages, accessToken);
}

async function processMessageList(messages: Array<{ id: string; threadId: string }>, accessToken: string): Promise<GmailEmail[]> {
  const details: GmailEmail[] = [];

  for (const m of messages.slice(0, 8)) {
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const item = await res.json();
        const headers = item.payload?.headers || [];
        const { from, subject, date, senderName, senderEmail } = parseEmailHeaders(headers);
        const bodyText = extractBodyFromPayload(item.payload) || item.snippet || '';

        details.push({
          id: item.id,
          threadId: item.threadId,
          from,
          senderName,
          senderEmail,
          subject: subject || '(No Subject)',
          date: date || new Date().toISOString(),
          snippet: item.snippet || '',
          body: bodyText.slice(0, 1000)
        });
      }
    } catch (e) {
      console.error(`Failed to load details for message ${m.id}:`, e);
    }
  }

  return details;
}

export async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; id?: string }> {
  // Construct RFC 2822 email message
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body
  ];
  const emailRaw = messageParts.join('\r\n');
  const base64Safe = Buffer.from(emailRaw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: base64Safe })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send email via Gmail: ${errorText}`);
  }

  const result = await res.json();
  return { success: true, id: result.id };
}

export async function verifyGmailToken(accessToken: string): Promise<{ valid: boolean; emailAddress?: string; error?: string }> {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      return { valid: false, error: `Gmail verification failed (${res.status}): ${errText}` };
    }
    const data = await res.json();
    return { valid: true, emailAddress: data.emailAddress };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

