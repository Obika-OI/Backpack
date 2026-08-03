import { useState, useEffect, useCallback } from "react";
import { Heart, Sparkles, Brain, Trophy, RotateCcw, Check, Coffee, Smile } from "lucide-react";

interface Card {
  id: number;
  icon: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_ICONS = [
  { icon: "🎒", label: "Backpack" },
  { icon: "🥪", label: "Lunch Sandwich" },
  { icon: "📚", label: "Notebook" },
  { icon: "🍎", label: "Fresh Apple" },
  { icon: "🎓", label: "Graduation Cap" },
  { icon: "🌍", label: "Global Reach" },
  { icon: "⚡", label: "Brain Power" },
  { icon: "💡", label: "Bright Idea" },
];

const createShuffledCards = (): Card[] => {
  const duplicated = [...CARD_ICONS, ...CARD_ICONS];
  return duplicated
    .sort(() => Math.random() - 0.5)
    .map((item, index) => ({
      id: index,
      icon: item.icon,
      label: item.label,
      isFlipped: false,
      isMatched: false,
    }));
};

export const LunchGames = () => {
  const [activeTab, setActiveTab] = useState<'memory' | 'breathing' | 'quiz'>('memory');

  // Memory Game State
  const [cards, setCards] = useState<Card[]>(createShuffledCards);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // Breathing State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const quizQuestions = [
    {
      q: "Which country has the most official languages in Africa?",
      options: ["Zimbabwe (16)", "Nigeria (3)", "South Africa (11)", "Kenya (2)"],
      correct: 0,
    },
    {
      q: "If you study for 45 minutes and take a 15-minute lunch break, how many cycles in 2 hours?",
      options: ["1 cycle", "2 cycles", "3 cycles", "4 cycles"],
      correct: 1,
    },
    {
      q: "What is 12 × 12 - 44?",
      options: ["100", "120", "144", "88"],
      correct: 0,
    },
    {
      q: "Which nutrient provides sustained energy during study sessions?",
      options: ["Refined Sugar", "Complex Carbs & Protein", "Sodium", "Saturated Fat"],
      correct: 1,
    },
  ];

  const initializeMemoryGame = useCallback(() => {
    setCards(createShuffledCards());
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsWon(false);
  }, []);

  // Memory Game Flip Logic
  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);

    setCards((prevCards) =>
      prevCards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
    );

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        setCards((prevCards) =>
          prevCards.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, isMatched: true, isFlipped: true } : c
          )
        );
        setFlippedCards([]);
        setMatches((m) => {
          const nextMatches = m + 1;
          if (nextMatches === CARD_ICONS.length) setIsWon(true);
          return nextMatches;
        });
      } else {
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  // Breathing Loop
  useEffect(() => {
    if (!isBreathing) return;
    const phases: ('Inhale' | 'Hold' | 'Exhale')[] = ['Inhale', 'Hold', 'Exhale'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setBreathPhase(phases[idx]);
    }, 3500);
    return () => clearInterval(interval);
  }, [isBreathing]);

  // Quiz Answer
  const handleQuizAnswer = (optionIdx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);
    if (optionIdx === quizQuestions[quizIndex].correct) {
      setQuizScore((s) => s + 1);
    }

    setTimeout(() => {
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex((i) => i + 1);
        setSelectedAnswer(null);
      } else {
        setQuizCompleted(true);
      }
    }, 1200);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setSelectedAnswer(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1">
            <Coffee className="w-4 h-4" />
            <span>Lunch & Wellness Break</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lunch Break & Casual Games</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Take a well-deserved mental break during lunch. Play quick memory games, test casual trivia, or do guided breathing.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'memory'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Match</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trivia Dash</span>
          </button>
          <button
            onClick={() => setActiveTab('breathing')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'breathing'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Mindful Reset</span>
          </button>
        </div>
      </div>

      {/* Memory Match Game */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 text-sm">
            <div className="flex space-x-6">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Moves</span>
                <span className="font-bold text-slate-900 dark:text-white text-lg">{moves}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Matches</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  {matches} / {CARD_ICONS.length}
                </span>
              </div>
            </div>
            <button
              onClick={initializeMemoryGame}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Game</span>
            </button>
          </div>

          {isWon ? (
            <div className="text-center py-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
              <Trophy className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Lunch Time Champion! 🎉</h3>
              <p className="text-slate-600 dark:text-slate-300">
                You matched all cards in <span className="font-bold text-emerald-600 dark:text-emerald-400">{moves} moves</span>. Your brain is refreshed and ready!
              </p>
              <button
                onClick={initializeMemoryGame}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Play Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  disabled={card.isFlipped || card.isMatched}
                  className={`h-20 sm:h-24 rounded-xl font-bold text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 transform ${
                    card.isFlipped || card.isMatched
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-500 scale-100 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:scale-105'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? card.icon : '🎒'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trivia Dash */}
      {activeTab === 'quiz' && (
        <div className="max-w-xl mx-auto space-y-6">
          {!quizCompleted ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Question {quizIndex + 1} of {quizQuestions.length}</span>
                <span>Score: {quizScore}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg mb-4">
                  {quizQuestions[quizIndex].q}
                </h3>

                <div className="space-y-2.5">
                  {quizQuestions[quizIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswer === oIdx;
                    const isCorrect = oIdx === quizQuestions[quizIndex].correct;
                    let style = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-500";
                    
                    if (selectedAnswer !== null) {
                      if (isCorrect) style = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold";
                      else if (isSelected) style = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleQuizAnswer(oIdx)}
                        className={`w-full text-left p-3.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {selectedAnswer !== null && isCorrect && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <Smile className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Trivia Complete!</h3>
              <p className="text-slate-600 dark:text-slate-300">
                You scored <span className="font-bold text-indigo-600 dark:text-indigo-400">{quizScore} / {quizQuestions.length}</span>!
              </p>
              <button
                onClick={resetQuiz}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mindful Reset (Breathing Exercise) */}
      {activeTab === 'breathing' && (
        <div className="py-8 flex flex-col items-center justify-center space-y-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm text-center max-w-md">
            Relax your shoulders, take a sip of water, and follow the rhythmic breathing guide.
          </p>

          {!isBreathing ? (
            <button
              onClick={() => setIsBreathing(true)}
              className="w-44 h-44 rounded-full bg-pink-500/10 border-2 border-pink-500/40 text-pink-600 dark:text-pink-400 flex flex-col items-center justify-center hover:bg-pink-500/20 hover:scale-105 transition-all duration-300 shadow-md"
            >
              <Heart className="w-10 h-10 mb-2 animate-pulse" />
              <span className="font-bold text-sm">Start Lunch Reset</span>
            </button>
          ) : (
            <div className="relative flex items-center justify-center my-6">
              <div
                className={`w-60 h-60 rounded-full bg-pink-500/20 absolute transition-all duration-[3500ms] ease-in-out ${
                  breathPhase === 'Inhale' ? 'scale-150 opacity-60' : breathPhase === 'Hold' ? 'scale-150 opacity-90' : 'scale-100 opacity-30'
                }`}
              ></div>
              <div className="w-44 h-44 rounded-full bg-pink-600 text-white flex flex-col items-center justify-center relative z-10 shadow-xl">
                <span className="font-extrabold text-xl tracking-widest uppercase">{breathPhase}</span>
              </div>
            </div>
          )}

          {isBreathing && (
            <button
              onClick={() => setIsBreathing(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white underline transition"
            >
              Stop Exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
};
