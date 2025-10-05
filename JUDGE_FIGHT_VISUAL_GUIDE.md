# Judge Fight Feature - Visual Guide

## What Users Will See

### Normal Panel Mode
```
┌─────────────────────────────────────┐
│         👥 Panel Verdict            │
│ The judges have spoken. Here's     │
│ what they think of your pitch.     │
└─────────────────────────────────────┘

[Judge 1] [Judge 2] [Judge 3] [Judge 4]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│ 👤 Judge Name  [common] [GLITCHED] │
│ Description text...                 │
│                                     │
│ ┃ Feedback about your pitch...     │
└─────────────────────────────────────┘

        [Get Report Card →]
```

### Fight Mode (40% Chance)
```
┌─────────────────────────────────────┐
│ ⚔️  🔥 JUDGE FIGHT ACTIVATED! 🔥     │
│ The judges have forgotten about    │
│ your pitch and are roasting each   │
│ other instead!                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    ⚡ Judge Battle Royale! ⚡       │
│  Things got heated in the          │
│  deliberation room...              │
└─────────────────────────────────────┘

[⚔️ Judge 1] [⚔️ Judge 2] [⚔️ Judge 3] [⚔️ Judge 4]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│ 👤 Judge Name  [common] [⚔️ ROASTING]│
│ Description text...                 │
│ Target: [Judge X] [Judge Y]        │
│                                     │
│ ┃ ROAST TEXT (bold, red theme)     │
│ ┃ "Your opinion is as outdated...  │
└─────────────────────────────────────┘

      [View Results Anyway →]
```

## Color Scheme

### Normal Mode:
- Border: Primary color / Green (positive) / Red (negative)
- Background: Muted
- Glow: Sentiment-based (green/red)

### Fight Mode:
- Border: **Red** (all cards)
- Background: **Red-tinted**
- Glow: **Red shadow**
- Text: **Bold roasts**
- Badges: **Red "ROASTING" badges**
- Targets: **Red outlined badges**

## Interactions

### Audio Playback:
- Normal Mode: Judge's feedback with TTS voice
- Fight Mode: Judge's roast with TTS voice (angrier tone implied)

### Tabs:
- Normal Mode: Plain judge names
- Fight Mode: Sword icons (⚔️) before judge names

### Animations:
- Fight Mode title: Pulsing ⚡ icons
- All cards: Red glow effect
- Target badges: Highlight on hover

## Behavior

1. **Trigger**: 40% random chance when panel feedback is generated
2. **Applies to**: Panel mode ONLY (not single judge)
3. **Can combine with**: Glitch events (rare but possible)
4. **Affects**: Feedback display only, report card is still generated

## Technical Details

- Each judge roasts 1-2 other judges
- AI generates personality-appropriate roasts
- TTS audio still generated
- Sentiment forced to 'negative' for roasts
- targetJudges array tracks who is being roasted
