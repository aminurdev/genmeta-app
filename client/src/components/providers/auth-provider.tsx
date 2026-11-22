"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  getCurrentUser,
  logout as authLogout,
} from "@/services/auth-services";
import { getClientCookie } from "@/lib/cookies-client";
import { SESSION_HINT_COOKIE_NAME } from "@/lib/auth-constants";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isSuperAdmin: false,
  setUser: () => {},
  refreshUser: async () => null,
  logout: async () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser(true);
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    if (getClientCookie(SESSION_HINT_COOKIE_NAME) === "1") {
      refreshUser();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [initialUser, refreshUser]);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";
  const isSuperAdmin = user?.role === "superAdmin";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        setUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
