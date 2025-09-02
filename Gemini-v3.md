**Generate a complete React.js web application: a Yoga Session Scheduler.**
Users input available time to receive intelligently generated, sequence-respecting yoga session suggestions.

**Key Features & Requirements:**

1.  **React.js App:** Use functional components (`useState`, `useEffect`, `useCallback`); `App` is default export.
2.  **Styling:** Use **Tailwind CSS** (standard color names) for fully responsive and appealing UI.
3.  **Yoga Practice Data:** Define `yogaPractices` array outside `App` (generic, externalizable). Each practice object includes `id`, `name`, `duration`, `category`, and `canFollow` (categories it can follow, including "Start"). Populate with provided data:
    ```javascript
    const yogaPractices = [
        { id: 'guru_pooja', name: "Guru Pooja", duration: 6, category: "Warm-up", canFollow: ["Start"] },
        { id: 'upa_yoga', name: "Upa Yoga", duration: 10, category: "Warm-up", canFollow: ["Start", "Warm-up"] },
        { id: 'yoga_namaskar', name: "Yoga Namaskar", duration: 5, category: "Warm-up", canFollow: ["Start", "Warm-up"] },
        { id: 'pranayam_simple', name: "Simple Pranayam", duration: 8, category: "Pranayama", canFollow: ["Start", "Warm-up", "Kriya", "Meditation", "Asana"] },
        { id: 'nadi_shodhana', name: "Nadi Shodhana", duration: 12, category: "Pranayama", canFollow: ["Start", "Warm-up", "Kriya", "Meditation", "Asana"] },
        { id: 'isha_kriya', name: "Isha Kriya", duration: 7, category: "Meditation", canFollow: ["Start", "Warm-up", "Kriya", "Pranayama", "Meditation", "Asana"] },
        { id: 'meditation_short', name: "Short Meditation", duration: 10, category: "Meditation", canFollow: ["Start", "Warm-up", "Kriya", "Pranayama", "Meditation", "Asana"] },
        { id: 'chanting', name: "Chanting", duration: 10, category: "Meditation", canFollow: ["Start", "Warm-up", "Kriya", "Pranayama", "Meditation", "Asana"] },
        { id: 'shambhavi', name: "Shambhavi Mahamudra Kriya", duration: 21, category: "Kriya", canFollow: ["Warm-up", "Pranayama"] },
        { id: 'surya_kriya', name: "Surya Kriya", duration: 21, category: "Kriya", canFollow: ["Warm-up", "Pranayama"] },
        { id: 'bhuta_shuddhi', name: "Bhuta Shuddhi", duration: 15, category: "Kriya", canFollow: ["Warm-up", "Pranayama"] },
        { id: 'suryanamaskaram', name: "Suryanamaskaram (Full)", duration: 40, category: "Asana", canFollow: ["Warm-up", "Pranayama"] },
        { id: 'savasana', name: "Savasana", duration: 5, category: "Cool-down", canFollow: ["Warm-up", "Pranayama", "Kriya", "Meditation", "Asana"] }
    ];
    ```
4.  **Learned Practices:** Users toggle practices they've learned (`learnedPracticesIds` Set, default: 'guru\_pooja', 'upa\_yoga', 'isha\_kriya'). Changes clear current session and regenerate suggestions.
5.  **Session Suggestions:** Input 'Available Minutes' and click 'Set Time' to generate ordered, non-repeating combinations of *learned* practices. A recursive algorithm (`findCombinations`) enforces `canFollow` rules. **Guru Pooja** (if learned) must start sessions; **Savasana** (if included) must end them. Suggestions are sorted by time fit (closest first) and then by fewer practices. Display up to 15 suggestions. Clicking a suggestion loads it into the current session.
6.  **Manual Add:** Buttons for learned practices allow adding to `selectedPractices` if time, sequence, and uniqueness rules are met.
7.  **Current Session Display:** Shows `selectedTime`, `remainingTime`, and a list of `selectedPractices`. 'Clear Session' button resets.
8.  **AI Suggestion (Gemini API):** 'Get AI Suggestion' button calls `gemini-2.0-flash`. The prompt includes current session, remaining time, last practice category, and unselected learned practices. AI suggests one complementary practice (JSON output) that fits time and sequence. Shows loading spinner; validates AI's output before offering to add.
9.  **Custom Message Box:** A modal component replaces `alert()` for warnings/info (e.g., 'Cannot Add', 'Sequence Error').

**Code Structure:** Uses `useCallback` and `useEffect` for efficient state management. Includes console logs for debugging.
