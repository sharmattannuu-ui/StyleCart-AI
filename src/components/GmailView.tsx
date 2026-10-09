import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Send,
  Sparkles,
  User,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import { GmailEmail } from '../types/index.js';
import { useAuth, GoogleSignInButton } from '../context/AuthContext.js';
import { api } from '../lib/api.js';

interface GmailViewProps {
  onEnquiryCreated?: () => void;
}

export const GmailView: React.FC<GmailViewProps> = ({ onEnquiryCreated }) => {
  const { user, isGmailConnected, gmailAccount, isLoggingIn, signIn, signOut, error: authError } = useAuth();

  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Quick reply modal
  const [replyingEmail, setReplyingEmail] = useState<GmailEmail | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isDraftingAi, setIsDraftingAi] = useState(false);

  const loadEmails = async (query = '') => {
    if (!isGmailConnected) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.getGmailMessages(query);
      setEmails(data);
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
      setFetchError(err.message || 'Failed to fetch messages from Gmail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isGmailConnected) {
      loadEmails();
    } else {
      setEmails([]);
    }
  }, [isGmailConnected]);

  const handleImportAsEnquiry = async (email: GmailEmail) => {
    try {
      await api.importGmailAsEnquiry({
        senderName: email.senderName,
        senderEmail: email.senderEmail,
        subject: email.subject,
        body: email.body,
        snippet: email.snippet
      });
      // Mark as imported locally
      setEmails(prev =>
        prev.map(e => (e.id === email.id ? { ...e, isImported: true } : e))
      );
      if (onEnquiryCreated) {
        onEnquiryCreated();
      }
      alert(`Email from ${email.senderName} converted to a sales enquiry!`);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleOpenReplyModal = (email: GmailEmail) => {
    setReplyingEmail(email);
    setReplyBody(`Dear ${email.senderName},\n\nThank you for reaching out to StyleCart! `);
  };

  const handleSendEmailReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingEmail || !replyBody.trim()) return;
    setIsSendingReply(true);
    try {
      await api.sendGmailReply(
        replyingEmail.senderEmail,
        `Re: ${replyingEmail.subject}`,
        replyBody.trim()
      );
      alert(`Reply dispatched to ${replyingEmail.senderEmail} via Gmail.`);
      setReplyingEmail(null);
      setReplyBody('');
    } catch (err: any) {
      alert(`Failed to send email: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleGenerateAiEmailReply = async () => {
    if (!replyingEmail) return;
    setIsDraftingAi(true);
    try {
      const res = await api.chatWithAgent(
        `Draft a polite email response to customer "${replyingEmail.senderName}" who sent: "${replyingEmail.snippet || replyingEmail.subject}". Reference StyleCart clothing store policies.`
      );
      setReplyBody(res.reply);
    } catch (err: any) {
      alert(`Failed to generate draft: ${err.message}`);
    } finally {
      setIsDraftingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">Gmail Inbox Synchronization</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              OAuth 2.0
            </span>
          </div>
          <p className="text-sm text-stone-500">
            Access customer enquiry emails with permission from the store manager to sync into StyleCart.
          </p>
        </div>

        {isGmailConnected && (
          <button
            onClick={() => loadEmails(searchQuery)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F4EFE6] hover:bg-[#EAE2D2] text-stone-900 border border-[#DED3BD] rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Inbox</span>
          </button>
        )}
      </div>

      {/* Auth State Connection Card */}
      {!isGmailConnected ? (
        <div className="bg-white rounded-xl border border-[#EFE9DF] p-8 shadow-xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EFE9DF] flex items-center justify-center mx-auto text-amber-700">
            <Mail className="w-6 h-6" />
          </div>

          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Connect Your Google Account</h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              To read incoming customer emails and send replies directly from the app, authorization with Gmail permissions is required.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EFE9DF] text-left text-xs space-y-1.5 text-stone-600 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-stone-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Permission Capabilities Granted:</span>
            </div>
            <ul className="list-disc ml-5 space-y-0.5 text-[11px] text-stone-500">
              <li>Read customer emails regarding clothing enquiries and sizing questions</li>
              <li>Send drafted responses directly to customers from your address</li>
              <li>OAuth session securely stored on the server; persists across preview reloads</li>
            </ul>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2">
            <GoogleSignInButton
              onClick={signIn}
              loading={isLoggingIn}
              text="Authorize with Google"
              className="px-6 py-2.5 text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Status Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#EFE9DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900">Connected Account:</span>
                  <span className="text-xs font-mono text-stone-600">
                    {gmailAccount?.email || user?.email}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Gmail access active and verified on server. Persists across browser refreshes.
                </p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="text-xs text-stone-500 hover:text-rose-600 font-medium underline self-start md:self-center cursor-pointer"
            >
              Disconnect
            </button>
          </div>

          {/* Search Box */}
          <div className="bg-white p-4 rounded-xl border border-[#EFE9DF] shadow-xs flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Gmail for keywords: jeans, dress, sizing, discount, order..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadEmails(searchQuery)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#EFE9DF] rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white"
              />
            </div>
            <button
              onClick={() => loadEmails(searchQuery)}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50"
            >
              Search Gmail
            </button>
          </div>

          {fetchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xs overflow-hidden">
            <div className="divide-y divide-[#EFE9DF]">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-stone-400" />
                  <span>Connecting to Gmail API and retrieving customer messages...</span>
                </div>
              ) : emails.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Mail className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-medium text-stone-700">No emails matching current query</p>
                  <p className="text-xs text-stone-400">
                    Try searching with an empty query or keywords like "order", "jeans", "store", or "test".
                  </p>
                  <button
                    onClick={() => loadEmails('')}
                    className="mt-2 text-xs font-semibold text-stone-900 underline cursor-pointer"
                  >
                    Fetch Latest Inbox Messages
                  </button>
                </div>
              ) : (
                emails.map(email => (
                  <div
                    key={email.id}
                    className="p-4 hover:bg-[#FAF8F5] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-sm text-stone-900">
                          {email.subject}
                        </span>
                        {email.isImported && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Already In Enquiries
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2">{email.snippet || email.body}</p>

                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="font-semibold text-stone-700">{email.senderName}</span>
                        <span>&lt;{email.senderEmail}&gt;</span>
                        <span>•</span>
                        <span>{new Date(email.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenReplyModal(email)}
                        className="px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] hover:bg-[#F4EFE6] text-stone-800 border border-[#EFE9DF] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-stone-600" />
                        <span>Reply</span>
                      </button>

                      <button
                        onClick={() => handleImportAsEnquiry(email)}
                        disabled={email.isImported}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                          email.isImported
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-900 hover:bg-stone-800 text-amber-100'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{email.isImported ? 'Imported' : 'Convert to Enquiry'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyingEmail && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Reply via Gmail
              </h2>
              <button
                onClick={() => setReplyingEmail(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EFE9DF] text-xs space-y-1">
              <div><strong>To:</strong> {replyingEmail.senderEmail} ({replyingEmail.senderName})</div>
              <div><strong>Subject:</strong> Re: {replyingEmail.subject}</div>
            </div>

            <form onSubmit={handleSendEmailReply} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Email Body:</label>
                <button
                  type="button"
                  onClick={handleGenerateAiEmailReply}
                  disabled={isDraftingAi}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-[#F4EFE6] px-2 py-0.5 rounded border border-[#DED3BD] cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>{isDraftingAi ? 'Drafting...' : 'AI Draft Reply'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                required
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                className="w-full p-3 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReplyingEmail(null)}
                  className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply || !replyBody.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Confirm & Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
