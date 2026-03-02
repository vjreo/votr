# VOTR Launch Assessment & UI Roadmap

**Senior Engineering Assessment** | March 2025

---

## Executive Summary

VOTR has a **solid technical foundation** and **no full rebuild is recommended**. The architecture is clean, feature-based, and the backend + mobile stack are well-structured. The main gaps are **visual polish**, **UX simplification**, and **brand personality** to align with the design references (Chantal Varon's Voter, Palumba).

---

## Design Reference Insights

### Chantal Varon's Voter (chantal-varon.com)
- **Vibe**: Youthful, bright, confident—politics without being boring
- **Colors**: Yellow-orange as primary (60%—energy, excitement); red and blue used equally for non-partisan balance
- **Accessibility**: AA compliance
- **Keywords**: Connection, strength, unity, casual, youthful

### Palumba (evensfoundation.eu)
- **Values**: Interactive, transparent, engaging
- **Note**: Swipe UX on *topics/policies* aligns with VOTR’s onboarding. Swiping on *candidates* is avoided to reduce bias—users browse candidates via list/detail instead.

---

## Current State: Strengths

| Area | Status |
|------|--------|
| Tech Stack | Expo + React Native 0.81, New Architecture enabled |
| Structure | Feature-based (auth, candidates, elections, gamification) |
| Design System | Tokens (colors, typography, spacing, shadows) in place |
| Swipe UX | IssueSwipeCard (topics only—reduces bias; no candidate swiping) |
| Core Features | Feed, Search, Roster, Journey, elections, sample ballot |
| Gamification | XP, levels, achievements, policy quiz |

---

## Current State: Gaps

### 1. Navigation Overload
- **6 bottom tabs** (Feed, Search, My Roster, Journey, Profile, FAQ) is crowded
- Many users won't tap beyond 3–4 tabs
- **Recommendation**: Merge Feed + Search or move FAQ to Profile; reduce to 4–5 tabs

### 2. Visual Personality
- Current palette is safe; lacks the “youthful energy” from design references
- No custom typography; system fonts throughout
- Mix of emojis and Ionicons creates inconsistent tone

### 3. First Impressions
- **Splash**: Functional but minimal; no strong brand moment
- **Address Entry**: Boat/ocean illustration is whimsical but not voting-themed
- **Onboarding**: Swipe flow is good (Palumba-style), but copy and visuals could be punchier

### 4. Swipe Scope
- **Intentional**: Swiping is for topics/issues only (onboarding). Candidate discovery stays list-based to avoid superficial bias.

### 5. Empty States & Microcopy
- Empty states are utilitarian (“No candidates yet”)
- Could be warmer, more encouraging, and actionable

### 6. Tab Bar & Headers
- Tab bar is functional; could use subtle refinement (labels, icons)
- Feed header has notification icon with no clear action

---

## Recommended Action Plan

### Phase 1: Quick Wins (1–2 days)

1. **Splash Screen Refresh**
   - Add subtle gradient background (primary + accent)
   - Improve logo animation
   - Add brief tagline (“Your vote. Your voice.”) with better typography

2. **Tab Bar Cleanup**
   - Reduce to 5 tabs: Feed | Discover | Roster | Journey | Profile
   - Move FAQ into Profile (as a link)
   - Consistent icon treatment

3. **Visual Polish Pass**
   - Use Chantal's color scheme (yellow-orange primary; red/blue balanced for non-partisan)
   - Ensure consistent use of design tokens

### Phase 2: UX Enhancement (2–3 days)

4. **Address Entry Refresh**
   - Voting-themed illustration (completed)

5. **Empty State Improvements**
   - Friendlier copy and illustrations
   - Clear CTAs (“Try Discover” instead of “→ Try Search”)

### Phase 3: Brand & Polish (2–3 days)

7. **Typography**
   - Add custom font (e.g., DM Sans, Manrope) for headlines
   - Keep body readable (system or a solid sans)

8. **Color Energy (Chantal scheme)**
   - Primary: yellow-orange (CTAs, tabs, highlights)
   - Red and blue used equally for party indicators

9. **Accessibility**
   - Run contrast check (WebAIM)
   - Ensure touch targets ≥ 44pt

---

## Technical Notes

- **No architectural rebuild** recommended
- Roster is AsyncStorage-only; consider backend sync for logged-in users (post-launch)
- Swiping: topics only (onboarding); candidate discovery remains list-based to reduce bias

---

## Launch Checklist

- [ ] Splash + first-run experience polished
- [ ] Tab bar simplified (5 tabs)
- [ ] Swipe reserved for topics only (no candidate swiping)
- [ ] Address entry visual refresh
- [ ] Empty states + microcopy pass
- [ ] Accessibility pass (contrast, touch targets)
- [ ] Backend health-check for production
- [ ] App store assets (screenshots, description)

---

## Next Steps

Proceed with **Phase 1** implementations first. Once those are in place, we can prioritize Phase 2 and 3 based on timeline and resources.
