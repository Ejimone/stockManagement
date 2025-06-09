import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import * as tokenStorage from "../services/tokenStorage";
import apiClient, { loginUser, LoginApiResponse } from "../services/api"; // Import apiClient and loginUser
import { debugConnection } from "../services/connectionDebug";

export interface User {
  id: string;
  email: string;
  role: "Admin" | "Salesperson" | string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password_str: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      setIsLoading(true);
      try {
        const storedTokens = await tokenStorage.getToken();
        const storedUser = (await tokenStorage.getUser()) as User | null;
        if (storedTokens && storedTokens.accessToken && storedUser) {
          setToken(storedTokens.accessToken);
          setUser(storedUser);
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedTokens.accessToken}`;
        } else {
          delete apiClient.defaults.headers.common["Authorization"];
        }
      } catch (e) {
        console.error("Failed to load auth state:", e);
        await tokenStorage.removeToken();
        await tokenStorage.removeUser();
        delete apiClient.defaults.headers.common["Authorization"];
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthState();
  }, []);

  const signIn = async (
    email_val: string,
    password_val: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Run connection debugging to help diagnose issues
      console.log("Running connection debug before sign-in attempt...");
      await debugConnection();

      const response: LoginApiResponse = await loginUser(
        email_val,
        password_val
      ); // Use loginUser from api.ts
      const { access, refresh, user: userData } = response;

      await tokenStorage.saveToken(access, refresh);
      await tokenStorage.saveUser(userData);

      setToken(access);
      setUser(userData);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      console.log("Sign-in successful, user data:", userData);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("Failed to sign in via AuthContext:", e);
      // Ensure cleanup if login API call failed but tokens were somehow set before
      await tokenStorage.removeToken();
      await tokenStorage.removeUser();
      delete apiClient.defaults.headers.common["Authorization"];
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Optional: Call a backend logout endpoint if available
      // await apiClient.post('/auth/logout/');
      await tokenStorage.removeToken();
      await tokenStorage.removeUser();
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common["Authorization"];
    } catch (e) {
      console.error("Failed to sign out:", e);
      // Even if backend logout fails, clear client-side session
      await tokenStorage.removeToken();
      await tokenStorage.removeUser();
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common["Authorization"];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
