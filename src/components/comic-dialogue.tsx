'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ComicDialogueProps {
  className?: string;
  isVisible?: boolean;
  isGlitched?: boolean;
  delay?: number; // Delay before first appearance in ms
  frequency?: number; // Base frequency for appearance in ms
  recordingTime?: number; // Current recording time to simulate context
  onDialogueChange?: (dialogueType: string) => void; // Callback to sync with emoji
}

// Pitch-specific dialogue responses with suspenseful reactions
const PITCH_DIALOGUES = {
  // Reactions to common startup buzzwords and concepts
  revenue: [
    { text: "Revenue already?!", type: "shocked" },
    { text: "Show me the money!", type: "skeptical" },
    { text: "Numbers don't lie...", type: "puzzled" },
    { text: "But is it sustainable?", type: "confused" },
    { text: "Impressive... if true", type: "skeptical" },
    { text: "Those are... numbers", type: "puzzled" },
    { text: "Growing fast... too fast?", type: "confused" }
  ],
  ai: [
    { text: "Another AI startup?", type: "frustrated" },
    { text: "AI solves everything?", type: "skeptical" },
    { text: "Buzzword alert!", type: "shocked" },
    { text: "Which AI model?", type: "puzzled" }
  ],
  disrupting: [
    { text: "Disrupting what now?", type: "confused" },
    { text: "Here we go again...", type: "frustrated" },
    { text: "Everything's disruptive!", type: "skeptical" },
    { text: "How original...", type: "shocked" }
  ],
  market: [
    { text: "How big is this market?", type: "puzzled" },
    { text: "Market research?", type: "skeptical" },
    { text: "TAM, SAM, SOM?", type: "confused" },
    { text: "Competition much?", type: "frustrated" }
  ],
  users: [
    { text: "How many real users?", type: "skeptical" },
    { text: "Active or registered?", type: "puzzled" },
    { text: "User retention?", type: "confused" },
    { text: "Show me metrics!", type: "frustrated" }
  ],
  funding: [
    { text: "How much money?!", type: "shocked" },
    { text: "What's the valuation?", type: "puzzled" },
    { text: "Burn rate concerns...", type: "confused" },
    { text: "Previous investors?", type: "skeptical" },
    { text: "Series what now?", type: "confused" },
    { text: "Pre or post money?", type: "puzzled" }
  ],
  blockchain: [
    { text: "Not another crypto!", type: "frustrated" },
    { text: "Web3 buzzword bingo!", type: "skeptical" },
    { text: "Where's the utility?", type: "puzzled" },
    { text: "Decentralized what?", type: "confused" }
  ],
  saas: [
    { text: "Monthly recurring what?", type: "puzzled" },
    { text: "Customer acquisition cost?", type: "confused" },
    { text: "Churn rate analysis?", type: "skeptical" },
    { text: "Lifetime value how much?", type: "shocked" }
  ],
  // Generic confused reactions for unclear content
  generic: [
    { text: "What just happened?", type: "confused" },
    { text: "Did they say...?", type: "puzzled" },
    { text: "I'm lost...", type: "confused" },
    { text: "Huh?!", type: "shocked" },
    { text: "Come again?", type: "puzzled" },
    { text: "That makes no sense!", type: "frustrated" },
    { text: "Wait, what?", type: "confused" },
    { text: "I don't get it...", type: "puzzled" },
    { text: "Are you serious?", type: "skeptical" },
    { text: "This is confusing!", type: "frustrated" },
    { text: "Say what now?", type: "shocked" },
    { text: "I'm so confused!", type: "confused" },
    { text: "That doesn't add up...", type: "skeptical" },
    { text: "My brain hurts!", type: "frustrated" },
    { text: "What's going on?", type: "puzzled" },
    { text: "I can't follow this!", type: "confused" },
    { text: "This is nonsense!", type: "frustrated" },
    { text: "Am I missing something?", type: "puzzled" },
    { text: "Total gibberish!", type: "shocked" },
    { text: "Help me understand!", type: "confused" },
    // Suspenseful reactions to keep pitchers guessing
    { text: "Interesting... or not?", type: "skeptical" },
    { text: "Hmm... maybe?", type: "puzzled" },
    { text: "I'm intrigued... NOT!", type: "frustrated" },
    { text: "Keep talking...", type: "confused" },
    { text: "This could work... nah", type: "skeptical" },
    { text: "Almost convinced...", type: "puzzled" },
    { text: "Tell me more... why?", type: "confused" },
    { text: "Getting somewhere...", type: "shocked" }
  ],
  // Special glitched dialogues
  glitched: [
    { text: "01001000 01110101 01101000?", type: "glitched" },
    { text: "SYSTEM ERROR!", type: "glitched" },
    { text: "MALFUNCTION DETECTED", type: "glitched" },
    { text: "REBOOTING...", type: "glitched" },
    { text: "NULL POINTER EXCEPTION", type: "glitched" },
    { text: "STACK OVERFLOW", type: "glitched" },
    { text: "404 BRAIN NOT FOUND", type: "glitched" },
    { text: "CORRUPTED DATA", type: "glitched" },
    { text: "PARSING ERROR...", type: "glitched" },
    { text: "SYNTAX_EXCEPTION", type: "glitched" }
  ]
};

// Comic bubble tail variations
const BUBBLE_STYLES = [
  "speech-bubble-left",
  "speech-bubble-right", 
  "thought-bubble",
  "shout-bubble"
];

// Smart dialogue selection based on pitch timing and context
const getContextualDialogue = (recordingTime: number, isGlitched: boolean) => {
  const pitchPhases = {
    intro: recordingTime < 8,          // 0-8 seconds: Introduction phase
    problem: recordingTime < 15,       // 8-15 seconds: Problem statement  
    solution: recordingTime < 22,      // 15-22 seconds: Solution explanation
    closing: recordingTime >= 22       // 22-30 seconds: Business model/ask
  };

  // Simulate pitch topics based on timing
  let topicPool: string[] = [];
  
  if (pitchPhases.intro) {
    topicPool = ['generic', 'market', 'disrupting'];
  } else if (pitchPhases.problem) {
    topicPool = ['ai', 'market', 'users', 'generic', 'blockchain'];
  } else if (pitchPhases.solution) {
    topicPool = ['ai', 'users', 'disrupting', 'generic', 'saas', 'blockchain'];
  } else if (pitchPhases.closing) {
    topicPool = ['revenue', 'funding', 'users', 'market', 'saas'];
  }

  // Add some randomness to topic selection
  const selectedTopic = topicPool[Math.floor(Math.random() * topicPool.length)];
  
  if (isGlitched && Math.random() < 0.7) {
    // 70% chance for glitched dialogues if judge is glitched
    return PITCH_DIALOGUES.glitched[Math.floor(Math.random() * PITCH_DIALOGUES.glitched.length)];
  }
  
  // Select from the appropriate topic pool
  const dialogues = PITCH_DIALOGUES[selectedTopic as keyof typeof PITCH_DIALOGUES] || PITCH_DIALOGUES.generic;
  return dialogues[Math.floor(Math.random() * dialogues.length)];
};

export default function ComicDialogue({ 
  className, 
  isVisible = true, 
  isGlitched = false, 
  delay = 0,
  frequency = 3000,
  recordingTime = 0,
  onDialogueChange
}: ComicDialogueProps) {
  // Initialize with contextual dialogue
  const [currentDialogue, setCurrentDialogue] = useState(() => getContextualDialogue(recordingTime, isGlitched));
  const [bubbleStyle, setBubbleStyle] = useState(BUBBLE_STYLES[Math.floor(Math.random() * BUBBLE_STYLES.length)]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setShowDialogue(false);
      return;
    }

    // Initial delay before first appearance
    const initialTimeout = setTimeout(() => {
      setShowDialogue(true);
      
      // Notify parent component about initial dialogue type
      if (onDialogueChange) {
        onDialogueChange(currentDialogue.type);
      }
      
      const interval = setInterval(() => {
        // Only show dialogue 60% of the time to make it less frequent
        if (Math.random() < 0.6) {
          setIsAnimating(true);
          setShowDialogue(false);
          
          // Brief pause before showing new dialogue
          setTimeout(() => {
          // Get contextual dialogue based on current recording time
          const randomDialogue = getContextualDialogue(recordingTime, isGlitched);
          const randomBubble = BUBBLE_STYLES[Math.floor(Math.random() * BUBBLE_STYLES.length)];
          
          setCurrentDialogue(randomDialogue);
          setBubbleStyle(randomBubble);
          setIsAnimating(false);
          setShowDialogue(true);
          
          // Notify parent component about dialogue type change
          if (onDialogueChange) {
            onDialogueChange(randomDialogue.type);
          }
          }, 300);
        }
      }, frequency + Math.random() * 3000); // Variable frequency with longer random delay

      return () => clearInterval(interval);
    }, delay);

    return () => {
      clearTimeout(initialTimeout);
    };
  }, [isVisible, delay, frequency, recordingTime, isGlitched]);

  if (!isVisible || !showDialogue) return null;

  const getDialogueColor = (type: string) => {
    switch (type) {
      case 'confused': return 'border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'puzzled': return 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-200';
      case 'shocked': return 'border-red-300 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200';
      case 'frustrated': return 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-200';
      case 'skeptical': return 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200';
      case 'glitched': return 'border-red-500 bg-red-100 text-red-900 dark:border-red-400 dark:bg-red-950/50 dark:text-red-100 animate-pulse';
      default: return 'border-gray-300 bg-gray-50 text-gray-800 dark:border-gray-600 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  return (
    <div className={cn(
      "absolute z-10 pointer-events-none animate-pop-in",
      isAnimating && "animate-wiggle",
      className
    )}>
      <div className={cn(
        "relative max-w-44 px-4 py-3 border-2 font-comic text-sm font-bold text-center shadow-xl",
        "transform transition-all duration-500 hover:scale-105",
        getDialogueColor(currentDialogue.type),
        bubbleStyle === "speech-bubble-left" && "rounded-2xl",
        bubbleStyle === "speech-bubble-right" && "rounded-2xl", 
        bubbleStyle === "thought-bubble" && "rounded-full",
        bubbleStyle === "shout-bubble" && "rounded-lg border-4",
        isGlitched && "glitch-text animate-bounce"
      )}>
        {currentDialogue.text}
        
        {/* Speech bubble tail for left alignment */}
        {bubbleStyle === "speech-bubble-left" && (
          <div className="absolute -bottom-3 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px]"
               style={{ borderTopColor: 'inherit' }} />
        )}
        
        {/* Speech bubble tail for right alignment */}
        {bubbleStyle === "speech-bubble-right" && (
          <div className="absolute -bottom-3 right-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px]"
               style={{ borderTopColor: 'inherit' }} />
        )}
        
        {/* Thought bubble pointer */}
        {bubbleStyle === "thought-bubble" && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]"
               style={{ borderTopColor: 'inherit' }} />
        )}
        
        {/* Shout bubble pointer */}
        {bubbleStyle === "shout-bubble" && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[16px]"
               style={{ borderTopColor: 'inherit' }} />
        )}
        
        {/* Thought bubble dots */}
        {bubbleStyle === "thought-bubble" && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <div className={cn("w-2 h-2 rounded-full opacity-80", getDialogueColor(currentDialogue.type).includes('yellow') ? 'bg-yellow-400' : 
                                 getDialogueColor(currentDialogue.type).includes('blue') ? 'bg-blue-400' :
                                 getDialogueColor(currentDialogue.type).includes('red') ? 'bg-red-400' :
                                 getDialogueColor(currentDialogue.type).includes('orange') ? 'bg-orange-400' :
                                 getDialogueColor(currentDialogue.type).includes('purple') ? 'bg-purple-400' : 'bg-gray-400')}></div>
              <div className={cn("w-1.5 h-1.5 rounded-full opacity-60", getDialogueColor(currentDialogue.type).includes('yellow') ? 'bg-yellow-400' : 
                                 getDialogueColor(currentDialogue.type).includes('blue') ? 'bg-blue-400' :
                                 getDialogueColor(currentDialogue.type).includes('red') ? 'bg-red-400' :
                                 getDialogueColor(currentDialogue.type).includes('orange') ? 'bg-orange-400' :
                                 getDialogueColor(currentDialogue.type).includes('purple') ? 'bg-purple-400' : 'bg-gray-400')}></div>
              <div className={cn("w-1 h-1 rounded-full opacity-40", getDialogueColor(currentDialogue.type).includes('yellow') ? 'bg-yellow-400' : 
                                 getDialogueColor(currentDialogue.type).includes('blue') ? 'bg-blue-400' :
                                 getDialogueColor(currentDialogue.type).includes('red') ? 'bg-red-400' :
                                 getDialogueColor(currentDialogue.type).includes('orange') ? 'bg-orange-400' :
                                 getDialogueColor(currentDialogue.type).includes('purple') ? 'bg-purple-400' : 'bg-gray-400')}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}