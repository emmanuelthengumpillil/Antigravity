import React, { useState } from 'react';
import { Play, Check, Code2, FileText, AlertTriangle, Terminal, Sparkles } from 'lucide-react';
import AITutor from './AITutor';

interface CodingWorkspaceProps {
  dominantEmotion?: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD';
}

export default function CodingWorkspace({ dominantEmotion = 'FOCUSED' }: CodingWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'code'>('code');
  const [language, setLanguage] = useState<'python' | 'typescript'>('python');
  
  const defaultPython = `def two_sum(nums: list[int], target: int) -> list[int]:
    # Single-pass Hash Table approach
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test execution:
print(two_sum([2, 7, 11, 15], 9))
`;

  const defaultTypeScript = `function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`;

  const [code, setCode] = useState(defaultPython);
  const [output, setOutput] = useState<string | null>(null);
  const [isFailing, setIsFailing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      // Mock execution check
      if (code.includes('seen') && code.includes('target -')) {
        setOutput("Output: [0, 1]\nCase 1: Passed ✅ (target=9, nums=[2,7,11,15])\nCase 2: Passed ✅ (target=6, nums=[3,2,4])\nRuntime: 54ms • Memory: 15.2MB");
        setIsFailing(false);
      } else {
        setOutput("Runtime Error: Test Case 2 failed. Expected [1, 2], got []. Verify index lookup.");
        setIsFailing(true);
      }
    }, 600);
  };

  const handleLanguageChange = (lang: 'python' | 'typescript') => {
    setLanguage(lang);
    setCode(lang === 'python' ? defaultPython : defaultTypeScript);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-3 p-3 select-none">
      {/* Upper Problem & Editor Pane */}
      <div className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Control Bar */}
        <div className="px-4 py-2.5 bg-neutral-950 border-b border-white/10 flex items-center justify-between">
          {/* Tabs: Problem Overview vs Editor */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'problem'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Problem</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
          </div>

          {/* Language Selector & Actions */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => handleLanguageChange('python')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  language === 'python' ? 'bg-white/15 text-white font-bold' : 'text-white/40 hover:text-white'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => handleLanguageChange('typescript')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  language === 'typescript' ? 'bg-white/15 text-white font-bold' : 'text-white/40 hover:text-white'
                }`}
              >
                TS
              </button>
            </div>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-mono font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>
        </div>

        {/* Problem Tab View */}
        {activeTab === 'problem' && (
          <div className="p-4 space-y-3 overflow-y-auto text-xs text-white/80 leading-relaxed font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white tracking-tight">1. Two Sum</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                EASY
              </span>
            </div>
            <p>
              Given an array of integers <code className="text-cyan-300 font-mono">nums</code> and an integer <code className="text-cyan-300 font-mono">target</code>, return indices of the two numbers such that they add up to target.
            </p>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-white/5 space-y-1 font-mono text-[11px]">
              <div className="text-white/40">Example 1:</div>
              <div>Input: nums = [2,7,11,15], target = 9</div>
              <div className="text-emerald-400">Output: [0,1] (nums[0] + nums[1] == 9)</div>
            </div>
            <div className="text-[11px] text-white/50 space-y-0.5">
              <div>Constraints:</div>
              <div>• 2 &lt;= nums.length &lt;= 10⁴</div>
              <div>• Only one valid answer exists.</div>
            </div>
          </div>
        )}

        {/* Code Editor View */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col p-2 bg-[#000000]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-transparent text-white/90 font-mono text-xs p-2 resize-none focus:outline-none leading-relaxed selection:bg-cyan-500/20"
            />
          </div>
        )}

        {/* Output Console Pane */}
        {output && (
          <div className="p-3 bg-black/90 border-t border-white/10 font-mono text-[11px] text-white/80 space-y-1">
            <div className="flex items-center justify-between text-white/40 pb-1 border-b border-white/5">
              <span className="flex items-center space-x-1">
                <Terminal className="w-3 h-3" />
                <span>Execution Output</span>
              </span>
              <button onClick={() => setOutput(null)} className="hover:text-white">✕</button>
            </div>
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>

      {/* Embedded Socratic AI Tutor Panel */}
      <AITutor
        userCode={code}
        isCodeFailing={isFailing}
        dominantEmotion={dominantEmotion}
        problemTitle="Two Sum"
      />
    </div>
  );
}
