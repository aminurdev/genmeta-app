"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  getCurrentUser,
  logout as authLogout,
} from "@/services/auth-services";
import { useCurrentUserQuery } from "@/services/queries/auth";
import { QUERY_KEYS } from "@/services/constants";
import { clearAllQueryCache } from "@/lib/query-cache";
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

const emptySubscribe = () => () => {};

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const queryClient = useQueryClient();
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [sessionOverride, setSessionOverride] = useState<boolean | null>(null);
  const hasSessionHint =
    sessionOverride ??
    (hasMounted && getClientCookie(SESSION_HINT_COOKIE_NAME) === "1");

  useEffect(() => {
    if (initialUser) {
      queryClient.setQueryData<User | null>(QUERY_KEYS.currentUser, initialUser);
      return;
    }

    if (hasMounted && !hasSessionHint) {
      const cachedUser = queryClient.getQueryData<User | null>(
        QUERY_KEYS.currentUser
      );
      if (cachedUser) {
        clearAllQueryCache(queryClient);
      }
    }
  }, [hasMounted, hasSessionHint, initialUser, queryClient]);

  const { data: queryUser, isPending, isFetching } = useCurrentUserQuery({
    enabled: hasMounted && hasSessionHint && !initialUser,
    initialData: initialUser ?? undefined,
  });

  const user = queryUser ?? initialUser ?? null;

  const setUser: React.Dispatch<React.SetStateAction<User | null>> = useCallback(
    (value) => {
      const prev =
        queryClient.getQueryData<User | null>(QUERY_KEYS.currentUser) ?? null;
      const next = typeof value === "function" ? value(prev) : value;

      if (!next) {
        clearAllQueryCache(queryClient);
        queryClient.setQueryData<User | null>(QUERY_KEYS.currentUser, null);
        setSessionOverride(false);
        return;
      }

      if (prev && prev._id && next._id && prev._id !== next._id) {
        clearAllQueryCache(queryClient);
      }

      queryClient.setQueryData<User | null>(QUERY_KEYS.currentUser, next);
      setSessionOverride(true);
    },
    [queryClient]
  );

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.currentUser,
        queryFn: () => getCurrentUser(true),
        staleTime: 0,
      });
      if (!currentUser) {
        clearAllQueryCache(queryClient);
        queryClient.setQueryData<User | null>(QUERY_KEYS.currentUser, null);
        setSessionOverride(false);
        return null;
      }
      setSessionOverride(true);
      return currentUser;
    } catch {
      clearAllQueryCache(queryClient);
      queryClient.setQueryData<User | null>(QUERY_KEYS.currentUser, null);
      setSessionOverride(false);
      return null;
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    await authLogout();
    clearAllQueryCache(queryClient);
    queryClient.setQueryData<User | null>(QUERY_KEYS.currentUser, null);
    setSessionOverride(false);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, [queryClient]);

  const isLoading =
    !user && (!hasMounted || (hasSessionHint && (isPending || isFetching)));
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
