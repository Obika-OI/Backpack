import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SpecialNeedsAccommodation } from '../types';
import { useAuth } from './AuthContext';

interface AccessibilityContextType {
  accommodations: SpecialNeedsAccommodation;
  updateAccommodations: (updates: Partial<SpecialNeedsAccommodation>) => void;
  resetAccommodations: () => void;
  // Live states
  dyslexiaFont: boolean;
  colorFilter: 'none' | 'soft-yellow' | 'sepia' | 'calm-green' | 'high-contrast-dark' | 'high-contrast-light';
  textSize: 'normal' | 'large' | 'xlarge';
  lineSpacing: 'normal' | 'relaxed' | 'double';
  readingRuler: boolean;
  reducedMotion: boolean;
  extraTimeMultiplier: number;
  // Text to Speech (TTS)
  isSpeaking: boolean;
  isPaused: boolean;
  ttsRate: number;
  speakText: (text: string) => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  setTtsRate: (rate: number) => void;
  // Modal control
  isAccessibilityModalOpen: boolean;
  setIsAccessibilityModalOpen: (open: boolean) => void;
}

const DEFAULT_ACCOMMODATIONS: SpecialNeedsAccommodation = {
  categories: [],
  extraTimeMultiplier: 1.0,
  dyslexiaFont: false,
  colorFilter: 'none',
  textSize: 'normal',
  lineSpacing: 'normal',
  screenReaderAssist: false,
  readingRuler: false,
  reducedMotion: false,
  healthConditionsNotes: '',
  emergencyCarePlan: ''
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const STORAGE_KEY = 'backpack_student_accommodations';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUser } = useAuth();

  const [accommodations, setAccommodations] = useState<SpecialNeedsAccommodation>(() => {
    if (currentUser?.accommodations) {
      return { ...DEFAULT_ACCOMMODATIONS, ...currentUser.accommodations };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_ACCOMMODATIONS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_ACCOMMODATIONS;
  });

  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsRate, setTtsRateState] = useState(1.0);
  const [rulerY, setRulerY] = useState<number | null>(null);

  const prevUserAccommodationsRef = useRef(currentUser?.accommodations);
  useEffect(() => {
    if (currentUser?.accommodations && currentUser.accommodations !== prevUserAccommodationsRef.current) {
      prevUserAccommodationsRef.current = currentUser.accommodations;
      const timer = setTimeout(() => {
        setAccommodations(prev => ({
          ...prev,
          ...currentUser.accommodations
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.accommodations]);

  const updateAccommodations = useCallback((updates: Partial<SpecialNeedsAccommodation>) => {
    setAccommodations(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (currentUser) {
        updateCurrentUser({ accommodations: next }).catch(err => {
          console.warn("Failed to sync accommodations with user profile:", err);
        });
      }
      return next;
    });
  }, [currentUser, updateCurrentUser]);

  const resetAccommodations = useCallback(() => {
    setAccommodations(DEFAULT_ACCOMMODATIONS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (currentUser) {
      updateCurrentUser({ accommodations: DEFAULT_ACCOMMODATIONS }).catch(() => {});
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [currentUser, updateCurrentUser]);

  // Apply visual styling to document based on active accommodations
  useEffect(() => {
    const root = document.documentElement;

    // 1. Dyslexia Font & Readability class
    if (accommodations.dyslexiaFont) {
      root.classList.add('dyslexia-font-active');
    } else {
      root.classList.remove('dyslexia-font-active');
    }

    // 2. Text Scaling
    root.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (accommodations.textSize === 'large') {
      root.classList.add('text-scale-large');
    } else if (accommodations.textSize === 'xlarge') {
      root.classList.add('text-scale-xlarge');
    }

    // 3. Line Spacing
    root.classList.remove('spacing-relaxed', 'spacing-double');
    if (accommodations.lineSpacing === 'relaxed') {
      root.classList.add('spacing-relaxed');
    } else if (accommodations.lineSpacing === 'double') {
      root.classList.add('spacing-double');
    }

    // 4. Reduced Motion
    if (accommodations.reducedMotion) {
      root.classList.add('reduced-motion-active');
    } else {
      root.classList.remove('reduced-motion-active');
    }

    // 5. Color Overlay Filter
    const filterClassList = [
      'color-filter-soft-yellow',
      'color-filter-sepia',
      'color-filter-calm-green',
      'color-filter-high-contrast-dark',
      'color-filter-high-contrast-light'
    ];
    filterClassList.forEach(cls => root.classList.remove(cls));

    if (accommodations.colorFilter && accommodations.colorFilter !== 'none') {
      root.classList.add(`color-filter-${accommodations.colorFilter}`);
    }
  }, [accommodations]);

  // Track cursor for reading ruler
  useEffect(() => {
    if (!accommodations.readingRuler) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setRulerY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [accommodations.readingRuler]);

  // Speech synthesis (TTS) handlers
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = ttsRate;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsRate]);

  const pauseSpeaking = useCallback(() => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resumeSpeaking = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const setTtsRate = useCallback((rate: number) => {
    setTtsRateState(rate);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        accommodations,
        updateAccommodations,
        resetAccommodations,
        dyslexiaFont: !!accommodations.dyslexiaFont,
        colorFilter: accommodations.colorFilter || 'none',
        textSize: accommodations.textSize || 'normal',
        lineSpacing: accommodations.lineSpacing || 'normal',
        readingRuler: !!accommodations.readingRuler,
        reducedMotion: !!accommodations.reducedMotion,
        extraTimeMultiplier: accommodations.extraTimeMultiplier || 1.0,
        isSpeaking,
        isPaused,
        ttsRate,
        speakText,
        pauseSpeaking,
        resumeSpeaking,
        stopSpeaking,
        setTtsRate,
        isAccessibilityModalOpen,
        setIsAccessibilityModalOpen
      }}
    >
      {children}

      {/* Interactive Reading Ruler for Dyslexia / ADHD / Low Vision */}
      {accommodations.readingRuler && rulerY !== null && (
        <div
          className="pointer-events-none fixed left-0 w-full z-50 transition-all duration-75"
          style={{ top: `${Math.max(0, rulerY - 18)}px`, height: '36px' }}
        >
          <div className="w-full h-full bg-amber-400/20 border-y-2 border-amber-500/60 shadow-lg backdrop-brightness-110" />
        </div>
      )}
    </AccessibilityContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
