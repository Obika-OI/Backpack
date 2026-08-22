import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccessibility } from '../../store/AccessibilityContext';
import { 
  X, 
  Eye, 
  Volume2, 
  VolumeX, 
  Clock, 
  Activity, 
  HeartHandshake, 
  Check, 
  Sparkles, 
  RotateCcw,
  BookOpen,
  ZoomIn,
  MoveHorizontal
} from 'lucide-react';

interface AccommodationToolsModalProps {
  onClose?: () => void;
}

export const AccommodationToolsModal: React.FC<AccommodationToolsModalProps> = ({ onClose }) => {
  const { 
    accommodations, 
    updateAccommodations, 
    resetAccommodations,
    dyslexiaFont,
    colorFilter,
    textSize,
    lineSpacing,
    readingRuler,
    reducedMotion,
    extraTimeMultiplier,
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
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'visual' | 'reading' | 'health_exam'>('visual');
  const [testSpeechSample, setTestSpeechSample] = useState(
    "Welcome to Backpack Institutional Learning. This is a text to speech preview designed to assist your reading."
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // If closed from context AND no explicit prop rendering
  if (!isAccessibilityModalOpen && !onClose) return null;

  const handleClose = () => {
    setIsAccessibilityModalOpen(false);
    if (onClose) onClose();
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      handleClose();
    }, 400);
  };

  const toggleCategory = (cat: 'visual' | 'hearing' | 'mobility' | 'cognitive_dyslexia' | 'adhd_neurodivergent' | 'chronic_health' | 'other') => {
    const currentCats = accommodations.categories || [];
    const exists = currentCats.includes(cat);
    const updated = exists 
      ? currentCats.filter(c => c !== cat) 
      : [...currentCats, cat];
    
    updateAccommodations({
      categories: updated,
      hasSpecialNeeds: updated.length > 0 || !!accommodations.specialNotes
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl h-[88vh] max-h-[750px] min-h-[500px] shadow-2xl overflow-hidden flex flex-col my-auto relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Special Needs & Accommodation Tools
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                  Universal Design
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize text readability, audio assistance, exam timing, and learning accessibility.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 pt-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'visual'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Visual & Display</span>
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'reading'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Reading & Audio TTS</span>
          </button>
          <button
            onClick={() => setActiveTab('health_exam')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'health_exam'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Exam & Health Plan</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
          {/* TAB 1: VISUAL & DISPLAY */}
          {activeTab === 'visual' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Dyslexia-Friendly Typography */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Dyslexia-Friendly Typography & Letterforms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Uses heavily weighted letter baselines, larger character spacing, and distinct glyphs to prevent letter flipping and crowding.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateAccommodations({ dyslexiaFont: !dyslexiaFont, enableDyslexiaFont: !dyslexiaFont })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 shrink-0 ${
                    dyslexiaFont ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      dyslexiaFont ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Text Sizing */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ZoomIn className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Text Scale & Font Size
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                    {textSize}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'large', 'xlarge'] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateAccommodations({ textSize: size })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition capitalize ${
                        textSize === size
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {size === 'normal' ? 'Standard (100%)' : size === 'large' ? 'Large (115%)' : 'Extra Large (130%)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Spacing */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MoveHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Line Height & Paragraph Spacing
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                    {lineSpacing}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'relaxed', 'double'] as const).map(spacing => (
                    <button
                      key={spacing}
                      type="button"
                      onClick={() => updateAccommodations({ lineSpacing: spacing })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition capitalize ${
                        lineSpacing === spacing
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {spacing}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Tint & Contrast Overlays */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Eye Strain & Irlen Color Tint Overlays
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                    {colorFilter}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'None (Default)', bg: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white' },
                    { id: 'soft-yellow', label: 'Soft Yellow Tint', bg: 'bg-amber-100 text-amber-900' },
                    { id: 'sepia', label: 'Warm Sepia', bg: 'bg-[#f4ecd8] text-yellow-950' },
                    { id: 'calm-green', label: 'Calm Sage Tint', bg: 'bg-emerald-100 text-emerald-950' },
                    { id: 'high-contrast-dark', label: 'High Contrast Dark', bg: 'bg-slate-950 text-white' },
                    { id: 'high-contrast-light', label: 'High Contrast Light', bg: 'bg-slate-100 text-black' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateAccommodations({ colorFilter: item.id as 'none' | 'soft-yellow' | 'sepia' | 'calm-green' | 'high-contrast-dark' | 'high-contrast-light' })}
                      className={`p-3 rounded-xl text-xs font-bold border text-center transition ${
                        colorFilter === item.id
                          ? 'ring-2 ring-purple-500 border-purple-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 opacity-90 hover:opacity-100'
                      } ${item.bg}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Reduced Motion & Vestibular Protection
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Disables fast zoom animations and parallax shifts to prevent motion sickness and vertigo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateAccommodations({ reducedMotion: !reducedMotion })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 shrink-0 ${
                    reducedMotion ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: READING & AUDIO TTS */}
          {activeTab === 'reading' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Reading Focus Ruler */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <MoveHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Visual Reading Guide / Focus Ruler
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Highlights a horizontal focus strip following your cursor to prevent line skipping while reading course notes and questions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateAccommodations({ readingRuler: !readingRuler })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 shrink-0 ${
                    readingRuler ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      readingRuler ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Text-to-Speech (TTS) Engine */}
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-purple-950 dark:text-purple-200 text-xs">
                      Text-to-Speech (TTS) Speech Assistant
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Speech Synthesizer
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Speech Rate / Speed ({ttsRate}x)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0.75, 1.0, 1.25, 1.5].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTtsRate(rate)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                          ttsRate === rate
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200'
                        }`}
                      >
                        {rate}x Speed
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Test Audio Readout Sample
                  </label>
                  <textarea
                    rows={2}
                    value={testSpeechSample}
                    onChange={e => setTestSpeechSample(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => speakText(testSpeechSample)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking && !isPaused ? 'Restart Audio' : 'Play Sample'}</span>
                    </button>
                    {isSpeaking && (
                      <>
                        <button
                          type="button"
                          onClick={isPaused ? resumeSpeaking : pauseSpeaking}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          type="button"
                          onClick={stopSpeaking}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXAM & HEALTH PLAN */}
          {activeTab === 'health_exam' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Extra Time Accommodations for Timed Exams & Quizzes */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Timed Assessments & Examination Multiplier
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {extraTimeMultiplier}x Time
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically extends quiz timers for students requiring extra reading, motor, or cognitive processing time.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { mult: 1.0, label: 'Standard (1.0x)' },
                    { mult: 1.25, label: '+25% (1.25x)' },
                    { mult: 1.5, label: '+50% (1.5x)' },
                    { mult: 2.0, label: 'Double (2.0x)' }
                  ].map(opt => (
                    <button
                      key={opt.mult}
                      type="button"
                      onClick={() => updateAccommodations({ 
                        extraTimeMultiplier: opt.mult,
                        extraExamTimeMinutes: opt.mult === 1.25 ? 15 : opt.mult === 1.5 ? 30 : opt.mult === 2.0 ? 60 : 0
                      })}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                        extraTimeMultiplier === opt.mult
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Needs & Health Condition Categories */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Health & Accommodation Categories
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select applicable categories to share with course instructors and admission reviewers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'cognitive_dyslexia' as const, label: 'Dyslexia / Reading Processing' },
                    { id: 'adhd_neurodivergent' as const, label: 'ADHD / Neurodivergent Support' },
                    { id: 'visual' as const, label: 'Visual Impairment / Low Vision' },
                    { id: 'hearing' as const, label: 'Deaf / Hard of Hearing' },
                    { id: 'mobility' as const, label: 'Mobility / Motor Impairment' },
                    { id: 'chronic_health' as const, label: 'Chronic Illness / Pain / Fatigue' },
                    { id: 'other' as const, label: 'Temporary Injury / Other' }
                  ].map(cat => {
                    const isSelected = (accommodations.categories || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-xl text-left text-xs font-bold border transition flex items-start justify-between ${
                          isSelected
                            ? 'bg-purple-600/10 border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Accommodations Written Statement */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-xs text-slate-900 dark:text-white block">
                  Accommodation Notes / Instructor Instructions
                </label>
                <textarea
                  rows={3}
                  value={accommodations.specialNotes || ''}
                  onChange={e => updateAccommodations({ 
                    specialNotes: e.target.value,
                    hasSpecialNeeds: true
                  })}
                  placeholder="e.g. Requires verbal instructions written in chat, captions on all uploaded video materials, or breaks during live sessions..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={resetAccommodations}
            className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition flex items-center space-x-1.5 shadow-lg shadow-purple-600/25 text-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
