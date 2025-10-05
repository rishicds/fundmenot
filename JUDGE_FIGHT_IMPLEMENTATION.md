# Judge Fight Feature Implementation

## Overview
Added a special "Judge Fight" event that triggers with a 40% chance in panel mode. Instead of providing feedback on the pitch, all judges roast each other based on their personalities.

## Changes Made

### 1. New AI Flow (`src/ai/flows/generate-judge-fight.ts`)
- Created `generateJudgeFight()` function that uses AI to generate roasts between judges
- Each judge roasts 1-2 other judges in the panel
- Roasts are personality-driven and humorous

### 2. Updated Types (`src/lib/types.ts`)
```typescript
JudgeFeedbackResponse:
  - Added targetJudges?: Judge[] // For fight mode - judges being roasted

PanelFeedbackResponse:
  - Added isFightMode?: boolean // Special event flag
```

### 3. Updated Server Actions (`src/app/actions.ts`)
- Added `FIGHT_CHANCE = 0.4` (40% probability)
- Modified `getPanelFeedback()` to:
  - Roll for fight mode at the start
  - If fight mode triggers:
    - Call `generateJudgeFight()` to get roasts
    - Generate TTS for each roast
    - Return responses with `targetJudges` and `isFightMode: true`
  - If normal mode:
    - Proceed with regular feedback flow (with glitch chances)

### 4. Updated UI (`src/components/panel-feedback-card.tsx`)

#### Visual Indicators:
- **Alert Banner**: Red alert at the top announcing "JUDGE FIGHT ACTIVATED!"
- **Card Styling**: Red border and glow for fight mode cards
- **Badges**: 
  - "ROASTING" badge with sword icon on each judge
  - Target badges showing who is being roasted
- **Tab Icons**: Sword icons in the tabs
- **Button Text**: Changes to "View Results Anyway"

#### Special Styling:
- Red theme throughout when fight mode is active
- Pulsing animations on title
- Red background tints on feedback cards
- Bold text for roasts

## How It Works

1. User records pitch in panel mode
2. 40% chance fight mode triggers instead of normal feedback
3. AI generates personality-based roasts between the 4 judges
4. Each judge's roast targets 1-2 other judges
5. UI displays with special fight mode theme
6. User can still proceed to report card

## Example Flow

Normal Mode:
```
Panel → Pitch → Feedback about pitch → Report Card
```

Fight Mode (40% chance):
```
Panel → Pitch → Judges roast each other! → Report Card
```

## Notes
- Only happens in panel mode (not single judge mode)
- Glitch events can still occur separately
- TTS is generated for roasts just like normal feedback
- Report card generation is unchanged
