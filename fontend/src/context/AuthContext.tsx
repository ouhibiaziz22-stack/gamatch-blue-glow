import { useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import type { ApiUser } from "@/lib/api";
import { AuthContext } from "./authContextDef";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(({ user }) => setUser(user))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithToken = async (tokenValue: string) => {
    localStorage.setItem("token", tokenValue);
    setToken(tokenValue);
    const { user } = await api.getMe();
    setUser(user);
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const data = await api.register({ firstName, lastName, email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithToken, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
