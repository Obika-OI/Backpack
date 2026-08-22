import React, { useState } from "react";
import { Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { KnowledgeCityModal } from "./KnowledgeCityModal";

interface KnowledgeCityBannerProps {
  variant?: 'student' | 'instructor' | 'compact';
  className?: string;
}

export const KnowledgeCityBanner: React.FC<KnowledgeCityBannerProps> = ({
  variant = 'student',
  className = '',
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl ${className}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                looking for self-paced solo courses or to teach a course independently?
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 ml-2"
          >
            <span>Knowledge City</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <KnowledgeCityModal isOpen={modalOpen} onClose={() => setModalOpen(false)} defaultTab="student" />
      </>
    );
  }

  return (
    <>
      <div className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/30 text-white shadow-md ${className}`}>
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Knowledge City App
                </span>
                <span className="text-xs text-indigo-200/60 font-medium">Individual Courses Portal</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                looking for self-paced solo courses or to teach a course independently?
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 shrink-0"
          >
            <span>{variant === 'instructor' ? 'Open Knowledge City Creator' : 'Explore Knowledge City'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <KnowledgeCityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={variant === 'instructor' ? 'instructor' : 'student'}
      />
    </>
  );
};
