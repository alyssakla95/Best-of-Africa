# 2026 UI/Visual Trends (The "Look & Feel")

*The exact styles that make an app look "Current Gen" in 2026.*

## 1. Aesthetic: "Crystal Glass" (Glassmorphism 2.0)
*   **What:** It's evolved from simple blur to a multi-layered, refractive "Ice" look.
*   **Thunder Bay Vibe:** This "frosted" aesthetic fits perfectly with a winter-themed portfolio.
*   **CSS Recipe:**
    ```css
    .crystal-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px) saturate(180%); /* Saturate makes colors pop */
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    ```

## 2. Interaction: "Tactile" Feedback (Framer Motion)
*   **Concept:** Buttons shouldn't just change color; they should *feel* like physical objects.
*   **The "Micro-Shrink":**
    ```jsx
    <motion.button whileTap={{ scale: 0.95 }}>
      Place Bet
    </motion.button>
    ```
    *Why:* This subtle 5% shrink confirms the action to the user's brain instantly.

## 3. The "Live Island" (Sports/Betting Pattern)
*   **Pattern:** A persistent, floating pill (top or bottom of viewport) showing the live score of the active game.
*   **UX:** It allows users to browse other stats while keeping their "eyes on the prize" (the live game score).

## 4. Typography: "Data Brutalism"
*   **Style:** Huge, monospaced fonts for key numbers (Odds, Scores, Timers).
*   **Recommendation:** `JetBrains Mono` or `Geist Mono`.
*   **Visual:** `SCORING DRIVE: 12 PLAYS, 84 YARDS` (All Caps, Mono, Bold).

## 5. Mobile Zone (The "Thumb Rule")
*   **Rule:** The bottom 30% of the screen is for Action (Place Bet, Cash Out). The top 70% is for Viewing (Video, Stats).
*   **Mistake to Avoid:** Never put a "Confirm Bet" button at the top of a mobile screen.

---
*Compiled January 6, 2026. Design for "Feel", not just "Looks".*
