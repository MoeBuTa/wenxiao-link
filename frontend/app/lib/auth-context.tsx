"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, apiFetch, apiJson } from "./api";

export type AuthUser = {
  username: string;
  isSuperuser: boolean;
};

type RegisterInput = {
  username: string;
  password: string;
  email?: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

type ServerUser = {
  username: string;
  is_superuser?: boolean;
};

function toAuthUser(u: ServerUser): AuthUser {
  return { username: u.username, isSuperuser: Boolean(u.is_superuser) };
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const resp = await apiFetch("/api/auth/me/", { cache: "no-store" });
      if (!resp.ok) {
        setUser(null);
        return;
      }
      const me = (await resp.json()) as ServerUser;
      setUser(toAuthUser(me));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiJson<{ user: ServerUser }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const authUser = toAuthUser(data.user);
    setUser(authUser);
    return authUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiJson<{ user: ServerUser }>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const authUser = toAuthUser(data.user);
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiJson("/api/auth/logout/", { method: "POST" });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
