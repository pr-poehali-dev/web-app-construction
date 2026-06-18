import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'sc_auth_user';

interface AuthUser {
  username: string;
  isAdmin: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (username: string, isAdmin: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string, isAdmin: boolean) => {
    const u = { username, isAdmin };
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
