import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error('Failed to log out.');
    }
  };

  const value = {
    user,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 