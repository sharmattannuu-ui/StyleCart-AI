import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/firebase.js';
import { api } from '../lib/api.js';

export interface GmailAccountInfo {
  email: string;
  name?: string;
  photoUrl?: string;
  connectedAt?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isGmailConnected: boolean;
  gmailAccount: GmailAccountInfo | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  checkGmailStatus: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isGmailConnected: false,
  gmailAccount: null,
  isLoading: true,
  isLoggingIn: false,
  signIn: async () => {},
  signOut: async () => {},
  checkGmailStatus: async () => {},
  error: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState<boolean>(false);
  const [gmailAccount, setGmailAccount] = useState<GmailAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkGmailStatus = useCallback(async () => {
    try {
      const status = await api.getGmailStatus();
      if (status.connected && status.userEmail) {
        setIsGmailConnected(true);
        setGmailAccount({
          email: status.userEmail,
          name: status.userName,
          photoUrl: status.userPhotoUrl,
          connectedAt: status.connectedAt
        });
      } else {
        setIsGmailConnected(false);
        setGmailAccount(null);
        if (status.expired) {
          setError(status.error || 'Gmail authorization expired. Please reconnect.');
        }
      }
    } catch (err: any) {
      console.warn('Could not verify Gmail status on load:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Check persistent server OAuth session immediately on load/refresh
    checkGmailStatus().finally(() => {
      setIsLoading(false);
    });

    // 2. Initialize Firebase Auth state listener
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, [checkGmailStatus]);

  const signIn = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);

        // Securely store OAuth session on the server
        const sessionResult = await api.saveGmailAuthSession({
          accessToken: result.accessToken,
          email: result.user.email || '',
          name: result.user.displayName || undefined,
          photoUrl: result.user.photoURL || undefined
        });

        setIsGmailConnected(true);
        setGmailAccount({
          email: sessionResult.userEmail || result.user.email || '',
          name: sessionResult.userName || result.user.displayName || '',
          photoUrl: result.user.photoURL || undefined
        });
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setError(err.message || 'Failed to authenticate with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signOut = async () => {
    try {
      await api.disconnectGmail();
      await logout();
      setUser(null);
      setAccessToken(null);
      setIsGmailConnected(false);
      setGmailAccount(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isGmailConnected,
        gmailAccount,
        isLoading,
        isLoggingIn,
        signIn,
        signOut,
        checkGmailStatus,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const GoogleSignInButton: React.FC<{ onClick: () => void; loading?: boolean; text?: string; className?: string }> = ({
  onClick,
  loading = false,
  text = 'Sign in with Google',
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium border border-stone-300 rounded-lg shadow-xs transition-all hover:shadow-sm disabled:opacity-60 cursor-pointer ${className}`}
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span>{loading ? 'Connecting...' : text}</span>
    </button>
  );
};
