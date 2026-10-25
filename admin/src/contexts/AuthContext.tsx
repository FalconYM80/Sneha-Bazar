import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  api,
  getAdminToken,
  getAdminUser,
  clearAuthSession,
  type AdminUser,
} from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => getAdminUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAdminToken()));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setIsAuthenticated(false);
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.auth.getProfile();
      if (response?.data) {
        setAdmin(response.data);
        setIsAuthenticated(true);
      } else {
        clearAuthSession();
        setAdmin(null);
        setIsAuthenticated(false);
      }
    } catch {
      clearAuthSession();
      setAdmin(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleUnauthorized = () => {
      setAdmin(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("admin:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
    };
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    if (response?.data?.admin) {
      setAdmin(response.data.admin);
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        admin,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
