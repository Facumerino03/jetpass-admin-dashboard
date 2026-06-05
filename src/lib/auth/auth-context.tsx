"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { UserPublic } from "@/types/api";
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from "@/lib/api/auth";
import { setAuthToken, setOnUnauthorized } from "@/lib/api/client";

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const REFRESH_TOKEN_KEY = "jp_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const doLogout = useCallback(async () => {
    const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (stored) await apiLogout(stored);
    } catch {
      // ignore logout errors
    }
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  }, []);

  const doLogin = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    setAuthToken(response.access_token);
    setUser(response.user);
    setIsAuthenticated(true);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  }, []);

  const doRefresh = useCallback(async (storedRefresh: string) => {
    try {
      const response = await apiRefreshToken(storedRefresh);
      setAuthToken(response.access_token);
      setUser(response.user);
      setIsAuthenticated(true);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    } catch {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Auth initialization on client mount
      doRefresh(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [doRefresh]);

  useEffect(() => {
    setOnUnauthorized(() => {
      doLogout();
    });
  }, [doLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login: doLogin,
        logout: doLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
