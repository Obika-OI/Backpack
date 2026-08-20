import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { User, Role } from '../types';

interface AuthState {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<{ user: FirebaseUser; role: Role }>;
  login: (email: string, password: string) => Promise<{ user: FirebaseUser; role: Role }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  currentUser: null,
  firebaseUser: null,
  loading: true,
  updateCurrentUser: async () => {},
  signup: async () => { throw new Error('Not implemented'); },
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (name: string, email: string, password: string, role: Role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (name) {
      try {
        await updateProfile(user, { displayName: name });
      } catch (e) {
        console.warn("Could not update auth displayName", e);
      }
    }

    const personalInformation = {
      id: user.uid,
      fullname: name,
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString(),
      ownerId: user.uid,
      kycVerified: false
    };

    // Initialize the user document in Firestore
    await setDoc(doc(db, 'backpack', user.uid), {
      user: {
        personalInformation,
        courses: [],
        enrollmentRequests: [],
        orgJoinRequests: [],
        orgMembers: [],
        userProgress: [],
        materials: [],
        attendance: [],
        assessments: [],
        submissions: [],
        scheduleEvents: []
      }
    });

    const newUserObj = {
      id: user.uid,
      name: name,
      email: email,
      role: role,
      createdAt: personalInformation.createdAt,
      kycVerified: false,
      ownerId: user.uid
    } as User;

    setCurrentUser(newUserObj);
    setFirebaseUser(user);
    setLoading(false);

    return { user, role };
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    let userRole: Role = 'student';
    try {
      const docSnap = await getDoc(doc(db, 'backpack', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userObj = Array.isArray(data.user) ? data.user[0] : data.user;
        userRole = userObj?.personalInformation?.role || 'student';
      }
    } catch (e) {
      console.warn("Could not pre-fetch role on login", e);
    }

    setFirebaseUser(user);
    return { user, role: userRole };
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setCurrentUser(null);
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const docRef = doc(db, 'backpack', currentUser.id);
    
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userObj = Array.isArray(data.user) ? data.user[0] || {} : (data.user || {});
        const personalInfo = userObj.personalInformation || {};
        
        const updatedPersonalInfo = { ...personalInfo };
        if (updates.name !== undefined) updatedPersonalInfo.fullname = updates.name;
        if (updates.role !== undefined) updatedPersonalInfo.role = updates.role;
        if (updates.email !== undefined) updatedPersonalInfo.email = updates.email;
        if (updates.headline !== undefined) updatedPersonalInfo.headline = updates.headline;
        if (updates.bio !== undefined) updatedPersonalInfo.bio = updates.bio;
        if (updates.cvUrl !== undefined) updatedPersonalInfo.cvUrl = updates.cvUrl;
        if (updates.kycDocumentUrl !== undefined) updatedPersonalInfo.kycDocumentUrl = updates.kycDocumentUrl;
        if (updates.kycVerified !== undefined) updatedPersonalInfo.kycVerified = updates.kycVerified;
        if (updates.userDocuments !== undefined) updatedPersonalInfo.userDocuments = updates.userDocuments;
        if (updates.paystackSubaccount !== undefined) updatedPersonalInfo.paystackSubaccount = updates.paystackSubaccount;
        
        // Organization data stored directly within personalInformation map
        if (updates.description !== undefined) updatedPersonalInfo.description = updates.description;
        if (updates.address !== undefined) updatedPersonalInfo.address = updates.address;
        if (updates.location !== undefined) updatedPersonalInfo.location = updates.location;
        if (updates.baseCurrency !== undefined) updatedPersonalInfo.baseCurrency = updates.baseCurrency;
        if (updates.orgType !== undefined) updatedPersonalInfo.orgType = updates.orgType;
        if (updates.registrationId !== undefined) updatedPersonalInfo.registrationId = updates.registrationId;
        if (updates.isAccredited !== undefined) updatedPersonalInfo.isAccredited = updates.isAccredited;
        if (updates.accreditingBody !== undefined) updatedPersonalInfo.accreditingBody = updates.accreditingBody;
        if (updates.accreditationStatus !== undefined) updatedPersonalInfo.accreditationStatus = updates.accreditationStatus;
        if (updates.accreditationDocUrl !== undefined) updatedPersonalInfo.accreditationDocUrl = updates.accreditationDocUrl;
        if (updates.ownerId !== undefined) updatedPersonalInfo.ownerId = updates.ownerId;
        if (updates.logoUrl !== undefined) updatedPersonalInfo.logoUrl = updates.logoUrl;
        if (updates.motto !== undefined) updatedPersonalInfo.motto = updates.motto;
        if (updates.phone !== undefined) updatedPersonalInfo.phone = updates.phone;
        if (updates.website !== undefined) updatedPersonalInfo.website = updates.website;
        if (updates.themeColor !== undefined) updatedPersonalInfo.themeColor = updates.themeColor;
        if (updates.academicHighlights !== undefined) updatedPersonalInfo.academicHighlights = updates.academicHighlights;
        if (updates.isDeleted !== undefined) updatedPersonalInfo.isDeleted = updates.isDeleted;
        
        // Remove undefined keys so Firestore doesn't fail
        const sanitizedPersonalInfo = Object.fromEntries(
          Object.entries(updatedPersonalInfo).filter(([, v]) => v !== undefined)
        );

        const updatedUser = {
          ...userObj,
          personalInformation: sanitizedPersonalInfo
        };
        
        await updateDoc(docRef, { user: updatedUser });
      }
      
      // Optimistic update
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error("Error updating user", err);
    }
  };

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Use onSnapshot to continuously sync the user doc
        unsubscribeDoc = onSnapshot(
          doc(db, 'backpack', user.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const userObj = Array.isArray(data.user) ? data.user[0] : data.user;
              const personalInfo = userObj?.personalInformation;
              
              if (personalInfo) {
                setCurrentUser({
                  id: user.uid,
                  name: personalInfo.fullname || personalInfo.name || user.displayName || user.email?.split('@')[0],
                  email: personalInfo.email || user.email || '',
                  role: personalInfo.role || 'student',
                  createdAt: personalInfo.createdAt || new Date().toISOString(),
                  headline: personalInfo.headline,
                  bio: personalInfo.bio,
                  cvUrl: personalInfo.cvUrl,
                  kycDocumentUrl: personalInfo.kycDocumentUrl,
                  kycVerified: personalInfo.kycVerified,
                  userDocuments: personalInfo.userDocuments,
                  paystackSubaccount: personalInfo.paystackSubaccount,
                  description: personalInfo.description,
                  address: personalInfo.address,
                  location: personalInfo.location,
                  baseCurrency: personalInfo.baseCurrency,
                  orgType: personalInfo.orgType,
                  registrationId: personalInfo.registrationId,
                  isAccredited: personalInfo.isAccredited,
                  accreditingBody: personalInfo.accreditingBody,
                  accreditationStatus: personalInfo.accreditationStatus,
                  accreditationDocUrl: personalInfo.accreditationDocUrl,
                  ownerId: personalInfo.ownerId || user.uid,
                  logoUrl: personalInfo.logoUrl,
                  motto: personalInfo.motto,
                  phone: personalInfo.phone,
                  website: personalInfo.website,
                  themeColor: personalInfo.themeColor,
                  academicHighlights: personalInfo.academicHighlights,
                  isDeleted: personalInfo.isDeleted
                } as User);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user data", error);
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading, updateCurrentUser, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
