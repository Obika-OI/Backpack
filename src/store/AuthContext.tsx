import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  currentUser: null,
  firebaseUser: null,
  loading: true,
  updateCurrentUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateCurrentUser = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const docRef = doc(db, 'users', currentUser.id);
    const cleaned: Record<string, unknown> = {};
    for (const key in updates) {
      const val = (updates as Record<string, unknown>)[key];
      if (val !== undefined) {
        cleaned[key] = val;
      }
    }
    await updateDoc(docRef, cleaned);
    setCurrentUser({ ...currentUser, ...cleaned });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUser({ id: user.uid, ...docSnap.data() } as User);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user role", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading, updateCurrentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
