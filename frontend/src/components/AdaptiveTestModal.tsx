import React, { useState } from 'react';
import { X, Check, Award, ArrowRight, BrainCircuit, Sparkles, HelpCircle } from 'lucide-react';

interface QuestionItem {
  level: string;
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const adaptiveQuestions: QuestionItem[] = [
  {
    level: 'Level 1: Hash Map Lookups',
    q: 'In a single-pass Hash Map approach for Two Sum, what is the average time complexity to check whether the complement (target - num) exists in the table?',
    options: [
      'A) O(1) Constant Time on Average',
      'B) O(N) Linear Scan per Element',
      'C) O(N log N) Heap Lookup',
      'D) O(N²) Quadratic Comparisons'
    ],
    correct: 0,
    explanation: 'Hash tables use hash indexing to achieve O(1) expected constant-time key lookup, turning what would be an O(N²) brute-force search into an optimal O(N) single-pass algorithm.'
  },
  {
    level: 'Level 2: Space Complexity Tradeoffs',
    q: 'Why does the single-pass Hash Map approach require O(N) extra auxiliary memory space compared to the brute force two-pointer scan?',
    options: [
      'A) It allocates memory for recursive call stack frames',
      'B) It stores up to N elements and their indices in the dictionary',
      'C) It duplicates the array into a binary search tree',
      'D) Python dictionaries require quadratic memory overhead'
    ],
    correct: 1,
    explanation: 'In the worst case (e.g. matching pair is at the very end), the map stores up to N - 1 previously inspected numbers, consuming O(N) auxiliary space.'
  },
  {
    level: 'Level 3: Edge Case Scenarios',
    q: 'What happens in Two Sum if an element can pair with itself (e.g. nums=[3, 3], target=6) in a single-pass hash map where seen[num] is set after checking the complement?',
    options: [
      'A) An IndexError is thrown immediately',
      'B) It correctly pairs the second 3 with the first 3 without self-pairing',
      'C) It enters an infinite while-loop',
      'D) It overwrites the target and returns [-1, -1]'
    ],
    correct: 1,
    explanation: 'Because we check if the complement is already in the map BEFORE storing the current element, nums[1] (3) finds nums[0] (3) already in seen and correctly returns [0, 1] without accidentally using the same element twice.'
  }
];

interface AdaptiveTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardPoints?: (points: number) => void;
}

export default function AdaptiveTestModal({ isOpen, onClose, onAwardPoints }: AdaptiveTestModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  if (!isOpen) return null;

  const currentQ = adaptiveQuestions[currentIndex];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);

    if (idx === currentQ.correct && onAwardPoints) {
      onAwardPoints(50);
    }
  };

  const handleNext = () => {
    setAnswered(false);
    setSelectedOption(null);
    setCurrentIndex((prev) => (prev + 1) % adaptiveQuestions.length);
  };

  const isCorrect = selectedOption === currentQ.correct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="w-full max-w-xl rounded-3xl bg-neutral-950 border border-white/15 p-6 md:p-8 shadow-2xl shadow-cyan-950/20 space-y-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight text-white">Adaptive Comprehension Check</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
                  {currentQ.level}
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">Calibrated to current LeetCode problem & flow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Text */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Problem Diagnostic Question {currentIndex + 1} of {adaptiveQuestions.length}</span>
          </div>
          <p className="text-sm font-medium text-white/90 leading-relaxed">
            {currentQ.q}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2 pt-1">
          {currentQ.options.map((option, idx) => {
            let btnStyle = 'bg-black/60 hover:bg-white/10 border-white/10 text-white/90';
            if (answered) {
              if (idx === currentQ.correct) {
                btnStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
              } else if (idx === selectedOption) {
                btnStyle = 'bg-red-950/40 border-red-500/60 text-red-300';
              } else {
                btnStyle = 'bg-black/40 border-white/5 text-white/40 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={answered}
                onClick={() => handleSelect(idx)}
                className={`w-full p-3 rounded-xl border text-xs text-left font-mono flex items-center justify-between transition-all ${btnStyle}`}
              >
                <span>{option}</span>
                {answered && idx === currentQ.correct && (
                  <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Correct</span>
                  </span>
                )}
                {answered && idx === selectedOption && !isCorrect && (
                  <span className="flex items-center space-x-1 text-red-400 font-bold">
                    <X className="w-3.5 h-3.5" />
                    <span>Incorrect</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation / Feedback Banner */}
        {answered && (
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 animate-fadeIn ${
              isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="font-bold flex items-center space-x-2">
              {isCorrect ? (
                <>
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Mastery Verified! +50 Streak Points Awarded 🎉</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Socratic Review Hint</span>
                </>
              )}
            </div>
            <p className="font-sans text-[11px] text-white/70">{currentQ.explanation}</p>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="text-[11px] font-mono text-white/40">
            {answered ? (isCorrect ? '✓ +50 Points Added' : 'Review and continue') : 'Choose the best answer'}
          </div>
          <div className="flex items-center space-x-2">
            {answered && (
              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-mono text-white flex items-center space-x-1 transition-all"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white text-black font-bold text-xs font-mono hover:bg-neutral-200 transition-all shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
