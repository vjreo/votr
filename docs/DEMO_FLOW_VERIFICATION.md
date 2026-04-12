# VOTR Demo Flow Verification Checklist

Use this checklist to verify the app matches the demo script in `DEMO_VIDEO_SCRIPT.md`.

## Prerequisites

1. **Start backend**: `cd backend && npm start`
2. **Start mobile**: `cd mobile && npx expo start` → press `i` for iOS simulator

## Verification Steps

| Step | Demo Expectation | What to Verify |
|------|-----------------|----------------|
| **1** | App opens → Splash → Address entry | Splash shows "VOTR" + "Making democracy sexy. Discover candidates that match your values." (~2s), then Address screen |
| **2** | Enter address (e.g. 525 N Tryon St, Charlotte, NC 28202) | Address form with placeholders. Enter full address, tap **Compare**. Creates user and saves location |
| **3** | Complete onboarding—swipe 3–4 issues right | "Swipe on Issues That Matter" header. Swipe right on climate, healthcare, education, etc. Tap "I'm done" or finish deck, then **Continue** |
| **4** | Feed loads → tap a candidate | Feed shows "Who's Running" with candidates grouped by office. Match scores visible. Tap a candidate card |
| **5** | Candidate detail → Add to Roster | Candidate detail screen. Tap "Add to Roster" (or similar). Candidate saved |
| **6** | Tab to My Roster → show saved candidates | Bottom tab "My Roster". Shows "Build Your Voting List" with saved candidates |
| **7** | Tab to Journey → show XP, badges | Bottom tab "Journey". Shows "Earn Your Civic Stripes" with XP, streaks, level, badges, policy quiz CTA |
| **8** | Tab to Profile → show address, elections link | Bottom tab "Profile". Shows voting address, "Upcoming Elections" link, preferences |

## Copy Alignment (from demo slides)

- **Splash**: "Making democracy sexy. Discover candidates that match your values."
- **Address**: "Enter your registered voting address to see candidates on your actual ballot."
- **Onboarding**: "Swipe on Issues That Matter" / "Tell us what you care about. Climate, healthcare, education—swipe right to rank your priorities."
- **Feed**: "Who's Running" / "Candidates on your ballot, organized by office. Match scores show alignment with your views."
- **Roster**: "Build Your Voting List" / "Save candidates you support. Your roster syncs across devices when you sign in."
- **Journey**: "Earn Your Civic Stripes" / "XP, streaks, and badges for engaging. Take the policy quiz to level up."

## UI Consistency (demo.html)

- Dark background (#1a1a1a)
- White/light gray text
- Orange accent (#FF9F1C)
- Pill-shaped buttons
- Rounded cards (24px)
