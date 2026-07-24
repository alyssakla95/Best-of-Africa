# Component & Interaction Patterns (2026)

*Practical guide to specific widgets and flows.*

## 1. The "Side Sheet" Standard
Centered modals are disappearing.
*   **The Trend:** For complex forms (like "Edit Player Details" or "Review Bet Slip"), use a **Side Sheet** that slides in from the right.
*   **Why:** It keeps the context visible (the user can still see the main dashboard behind it) and offers more vertical space than a squashed dialog.
*   **Implementation Note:** Look for `Sheet` components in libraries like Shadcn UI. Set `side="right"` as the default.

## 2. AI Confidence & Trust UI
If your app uses AI (e.g., for predictions), don't just show the result.
*   **The Pattern:** Display a "Confidence Score" (e.g., a small probability bar: "85% Match").
*   **Input Guidance:** Instead of validating *after* errors, use "Assistive Chips" that suggest valid inputs as the user types.

## 3. Playable Data (Interactive 3D Viz)
Static charts are dead for 2026 analytics.
*   **The Trend:** Graphs you can rotate, zoom, and "scrub."
*   **Use Case (Sports Analytics):** Instead of a flat line chart for a player's season, show a 3D terrain map of their shot efficiency that the user can spin.
*   **Dev Stack:** Visx (for React) or Nivo, but styled with WebGL effects for performance.

## 4. Biometric-First Authentication
*   **The Trend:** "Passkeys" are now the default.
*   **The UI:** The login screen often has no password field by default—just a big "Continue" button that triggers the OS-level FaceID/TouchID prompt.
*   **Dev Note:** This reduces UI complexity massively. You don't need "Confirm Password" or "Password Requirements" tooltips anymore.

## 5. Input Guidance (Pre-Validation)
*   **Pattern:** Instead of red error text *after* hitting submit, show a "Checklist" that turns green in real-time as the user types.
*   **Why:** It feels like a "Co-pilot" helping them complete the form, rather than a teacher grading a test.

---
*Compiled January 6, 2026 from component library trends (Material 3, Shadcn).*
