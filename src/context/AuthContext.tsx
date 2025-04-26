import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  Timestamp, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, AuthUser } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: async () => {},
  loading: true,
  error: null
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for Firebase auth state changes and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user document from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          console.log(userDoc.data())
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            
            // Check if user is admin or accountant and approved
            if (
              (userData.roles.includes('admin') || userData.roles.includes('accountant')) && 
              userData.status === 'approved'
            ) {
              const user: AuthUser = {
                id: firebaseUser.uid,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                roles: userData.roles,
                status: userData.status,
                createdAt: userData.createdAt,
                lastUpdated: userData.lastUpdated,
                isAuthenticated: true
              };
              
              setAuthUser(user);
              setIsAuthenticated(true);
              
              // Update last login time
              await updateDoc(doc(db, "users", firebaseUser.uid), {
                lastUpdated: serverTimestamp()
              });
            } else {
              // User doesn't have proper role or status
              await signOut(auth);
              setError("Access denied. Only approved administrators and accountants can access this panel.");
              setAuthUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // No user document found
            await signOut(auth);
            setError("User account not found.");
            setAuthUser(null);
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Error loading user data. Please try again.");
          setAuthUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No Firebase user
        setAuthUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Auth state change listener will handle the rest
      return true;
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/user-disabled') {
        setError("This account has been disabled. Please contact support.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many unsuccessful login attempts. Please try again later.");
      } else {
        setError("Failed to login. Please check your credentials and try again.");
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // Auth state change listener will handle the rest
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user: authUser, 
        login, 
        logout, 
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 