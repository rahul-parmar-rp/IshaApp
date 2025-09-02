import React, { useState, useEffect, useCallback } from 'react';

// Yoga Practice Data (now defined outside the component for genericity)
// In a real application, this could be fetched from an API or loaded from a JSON file.
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

const API_KEY = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

function App() {
    const [availableMinutes, setAvailableMinutes] = useState(30);
    const [selectedPractices, setSelectedPractices] = useState([]); // Practices currently in the session timeline
    const [learnedPracticesIds, setLearnedPracticesIds] = useState(() => new Set(['guru_pooja', 'upa_yoga', 'isha_kriya'])); // Default learned
    const [suggestedSessions, setSuggestedSessions] = useState([]);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [messageBox, setMessageBox] = useState(null);

    const currentTotalDuration = selectedPractices.reduce((sum, p) => sum + p.duration, 0);
    const remainingTime = availableMinutes - currentTotalDuration;

    // Function to show custom message box
    const showMessageBox = useCallback((title, message) => {
        setMessageBox({ title, message });
    }, []);

    // Function to close custom message box
    const closeMessageBox = useCallback(() => {
        setMessageBox(null);
    }, []);

    // Function to add a practice to the session (manual add or AI suggestion)
    const addPracticeToSession = useCallback((practiceId) => {
        const practiceToAdd = yogaPractices.find(p => p.id === practiceId);
        if (!practiceToAdd) return;

        if (!learnedPracticesIds.has(practiceId)) {
            showMessageBox('Cannot Add', 'This practice is not marked as learned. Please select it in "My Learned Practices" first.');
            return;
        }

        if (selectedPractices.some(p => p.id === practiceId)) {
            showMessageBox('Cannot Add', `"${practiceToAdd.name}" is already in your session. Each practice can be added only once.`);
            return;
        }

        const newTotalDuration = currentTotalDuration + practiceToAdd.duration;
        if (newTotalDuration > availableMinutes) {
            showMessageBox('Cannot Add', `Adding "${practiceToAdd.name}" would exceed your available time of ${availableMinutes} minutes.`);
            return;
        }

        const lastSelectedCategory = selectedPractices.length > 0 ? selectedPractices[selectedPractices.length - 1].category : "Start";
        if (!practiceToAdd.canFollow.includes(lastSelectedCategory)) {
            showMessageBox('Sequence Error', `"${practiceToAdd.name}" cannot follow a "${lastSelectedCategory}" practice.`);
            return;
        }

        setSelectedPractices(prev => [...prev, practiceToAdd]);
        setAiSuggestion(null); // Clear AI suggestion after adding
    }, [availableMinutes, currentTotalDuration, learnedPracticesIds, selectedPractices, showMessageBox]);

    // Function to clear the current session
    const clearSession = useCallback(() => {
        setSelectedPractices([]);
        setSuggestedSessions([]);
        setAiSuggestion(null);
    }, []);

    // --- Learned Practices Section Logic ---
    const toggleLearnedPractice = useCallback((practiceId) => {
        setLearnedPracticesIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(practiceId)) {
                newSet.delete(practiceId);
            } else {
                newSet.add(practiceId);
            }
            return newSet;
        });
        // Clear session and regenerate suggestions when learned practices change
        clearSession();
    }, [clearSession]);

    // --- Combination Logic with Sequencing and Learned Practices Filter (No Repeats) ---
    const generateSessionSuggestions = useCallback(() => {
        console.log('--- Generating suggestions ---');
        clearSession(); // Clear current session when new time is set

        const targetMinutes = availableMinutes;
        let allCombinations = [];
        const uniqueCombinationStrings = new Set();

        const guruPooja = yogaPractices.find(p => p.id === 'guru_pooja');
        const isGuruPoojaLearned = learnedPracticesIds.has(guruPooja.id);

        const availableLearnedPractices = yogaPractices.filter(p => learnedPracticesIds.has(p.id));
        console.log('Learned practices for suggestions:', availableLearnedPractices.map(p => p.name));

        if (availableLearnedPractices.length === 0) {
            setSuggestedSessions([]);
            return;
        }

        if (isGuruPoojaLearned && targetMinutes < guruPooja.duration) {
            setSuggestedSessions([]);
            showMessageBox('Not Enough Time', `You have learned Guru Pooja, but ${targetMinutes} minutes is not enough for it (${guruPooja.duration} min). No sessions can be generated.`);
            return;
        }

        const isValidSequence = (currentCombo, newPractice) => {
            if (currentCombo.length === 0) {
                return newPractice.canFollow.includes("Start");
            }
            const lastPractice = currentCombo[currentCombo.length - 1];
            return newPractice.canFollow.includes(lastPractice.category);
        };

        // Recursive function to find combinations
        const findCombinations = (startIndex, currentCombo, currentDuration) => {
            // Add valid combination if it fits and is not empty
            if (currentDuration <= targetMinutes && currentDuration > 0) {
                const orderedPracticeIds = currentCombo.map(p => p.id).join(',');
                if (!uniqueCombinationStrings.has(orderedPracticeIds)) {
                    allCombinations.push({
                        practices: [...currentCombo],
                        totalDuration: currentDuration
                    });
                    uniqueCombinationStrings.add(orderedPracticeIds);
                }
            }

            // Pruning: if duration already exceeds target, stop this branch
            if (currentDuration >= targetMinutes) {
                return;
            }

            // Iterate through available learned practices from startIndex to prevent repeats
            for (let i = startIndex; i < availableLearnedPractices.length; i++) {
                const practice = availableLearnedPractices[i];
                const newDuration = currentDuration + practice.duration;

                // Skip if adding this practice exceeds time
                if (newDuration > targetMinutes) {
                    continue;
                }

                // Special Guru Pooja handling for the first element
                if (currentCombo.length === 0) {
                    if (isGuruPoojaLearned && practice.id !== guruPooja.id) {
                        continue; // If Guru Pooja is learned, the first practice MUST be Guru Pooja
                    }
                    if (!isGuruPoojaLearned && practice.id === guruPooja.id) {
                         continue; // If Guru Pooja is NOT learned, it cannot be the first practice
                    }
                }

                // Check sequence validity
                if (!isValidSequence(currentCombo, practice)) {
                    continue;
                }

                // Add practice and recurse
                currentCombo.push(practice);
                findCombinations(i + 1, currentCombo, newDuration); // i + 1 for no repeats
                currentCombo.pop(); // Backtrack
            }
        };

        // Determine initial call based on Guru Pooja
        if (isGuruPoojaLearned) {
            // Start with Guru Pooja if it's learned
            findCombinations(0, [guruPooja], guruPooja.duration);
        } else {
            // Otherwise, start with an empty combo, considering all learned practices
            findCombinations(0, [], 0);
        }

        // Post-processing for strict Savasana placement (if present, must be last)
        let filteredCombinations = allCombinations.filter(combo => {
            const practices = combo.practices;
            if (practices.length === 0) return false;

            // Re-confirming Guru Pooja is first if it's in the combo
            if (isGuruPoojaLearned && practices.some(p => p.id === 'guru_pooja') && practices[0].id !== 'guru_pooja') {
                return false;
            }

            // Savasana check: If present, must be last
            if (practices.some(p => p.id === 'savasana') && practices[practices.length - 1].id !== 'savasana') {
                return false;
            }
            return true;
        });

        filteredCombinations.sort((a, b) => {
            const diffA = targetMinutes - a.totalDuration;
            const diffB = targetMinutes - b.totalDuration;

            if (diffA !== diffB) {
                return diffA - diffB;
            }
            return a.practices.length - b.practices.length;
        });

        setSuggestedSessions(filteredCombinations);
    }, [availableMinutes, learnedPracticesIds, clearSession, showMessageBox]);

    // Effect to generate suggestions when availableMinutes or learnedPracticesIds change
    useEffect(() => {
        generateSessionSuggestions();
    }, [availableMinutes, learnedPracticesIds, generateSessionSuggestions]);

    // Function to apply a suggested session to the current session display
    const applySuggestedSession = useCallback((practices) => {
        setSelectedPractices([...practices]);
        setAiSuggestion(null); // Clear AI suggestion
    }, []);

    // Function to get AI suggestion (single practice)
    const getAISuggestion = useCallback(async () => {
        setLoadingAI(true);
        setAiSuggestion(null); // Clear previous AI suggestion

        if (remainingTime <= 0) {
            setAiSuggestion({ message: 'No time remaining for new suggestions.' });
            setLoadingAI(false);
            return;
        }

        if (learnedPracticesIds.size === 0) {
            setAiSuggestion({ message: 'Please select your learned practices first to get AI suggestions.' });
            setLoadingAI(false);
            return;
        }

        const selectedPracticeNames = selectedPractices.map(p => `${p.name} (${p.duration} min)`).join(', ');
        const learnedPracticesList = yogaPractices
            .filter(p => learnedPracticesIds.has(p.id) && !selectedPractices.some(sp => sp.id === p.id)) // Filter out already selected practices
            .map(p => `${p.name} (${p.duration} min)`).join(', ');
        const lastPracticeCategory = selectedPractices.length > 0 ? selectedPractices[selectedPractices.length - 1].category : "Start";

        if (learnedPracticesList.length === 0 && selectedPractices.length > 0) {
            setAiSuggestion({ message: 'No unselected learned practices available to suggest.' });
            setLoadingAI(false);
            return;
        }
        if (learnedPracticesList.length === 0 && selectedPractices.length === 0) {
            setAiSuggestion({ message: 'No learned practices available to suggest.' });
            setLoadingAI(false);
            return;
        }

        const prompt = `Given that the user has already selected these yoga practices: [${selectedPracticeNames || "None"}], the last practice added was of category "${lastPracticeCategory}", and has ${remainingTime} minutes remaining. From the following list of available yoga practices (which are the only ones the user has learned and are not already in the session): [${learnedPracticesList}], suggest ONE additional yoga practice that would complement the current selection and fit within the remaining time. Ensure the suggested practice follows a logical sequence based on common yoga flows (e.g., warm-up before kriya, kriya before cool-down/meditation). Prioritize practices that fit well and use a good portion of the remaining time. If no suitable practice is found, respond with "None". Provide the response in JSON format with 'practiceName' and 'duration' fields. Example: {"practiceName": "Upa Yoga", "duration": 10} or {"practiceName": "None", "duration": 0}.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "practiceName": { "type": "STRING" },
                        "duration": { "type": "NUMBER" }
                    },
                    "propertyOrdering": ["practiceName", "duration"]
                }
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const suggestedPractice = JSON.parse(jsonText);

                if (suggestedPractice.practiceName && suggestedPractice.practiceName !== "None" && suggestedPractice.duration > 0) {
                    const foundPractice = yogaPractices.find(p => p.name === suggestedPractice.practiceName && p.duration === suggestedPractice.duration && learnedPracticesIds.has(p.id));

                    if (foundPractice && foundPractice.duration <= remainingTime && !selectedPractices.some(p => p.id === foundPractice.id)) {
                        const lastSelectedCategory = selectedPractices.length > 0 ? selectedPractices[selectedPractices.length - 1].category : "Start";
                        if (foundPractice.canFollow.includes(lastSelectedCategory)) {
                            setAiSuggestion({ practice: foundPractice });
                        } else {
                            setAiSuggestion({ message: 'AI suggested a practice, but it does not fit the sequence rules.' });
                        }
                    } else {
                        setAiSuggestion({ message: 'AI could not find a suitable practice that fits the remaining time, is not in your learned practices, or is already in the session.' });
                    }
                } else {
                    setAiSuggestion({ message: 'AI could not find a suitable practice at this time.' });
                }
            } else {
                setAiSuggestion({ message: 'Failed to get AI suggestion. Please try again.' });
            }
        } catch (error) {
            console.error('Error fetching AI suggestion:', error);
            setAiSuggestion({ message: 'Error getting AI suggestion. Please check console.' });
        } finally {
            setLoadingAI(false);
        }
    }, [availableMinutes, learnedPracticesIds, remainingTime, selectedPractices]);


    return (
        <div className="min-h-screen flex justify-center items-start p-5 bg-blue-50">
            <div className="container bg-white p-8 rounded-xl shadow-lg w-full max-w-5xl flex flex-col gap-6">
                <h1 className="text-emerald-600 text-4xl font-bold mb-5">Yoga Scheduler</h1>

                <div className="flex justify-center items-center gap-4 mb-5 p-4 bg-blue-100 rounded-lg">
                    <label htmlFor="minutesInput" className="text-lg font-medium text-gray-700">Available Minutes:</label>
                    <input
                        type="number"
                        id="minutesInput"
                        value={availableMinutes}
                        onChange={(e) => setAvailableMinutes(parseInt(e.target.value) || 0)}
                        min="1"
                        className="p-2.5 border border-gray-300 rounded-md text-base w-32 text-center outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                    />
                    <button
                        onClick={generateSessionSuggestions}
                        className="bg-emerald-500 text-white px-5 py-2.5 rounded-md text-base font-semibold shadow-md hover:bg-emerald-600 transform active:translate-y-0 active:shadow-sm"
                    >
                        Set Time
                    </button>
                </div>

                <div className="flex flex-wrap justify-center gap-8">
                    <div className="flex flex-col gap-5 flex-1 min-w-[300px]">
                        <div className="bg-gray-50 p-5 rounded-lg shadow-inner">
                            <h2 className="text-blue-600 text-2xl font-semibold mb-4">My Learned Practices</h2>
                            <p className="text-sm text-gray-600 mb-4">Select the practices you know:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {yogaPractices.map(practice => (
                                    <button
                                        key={practice.id}
                                        onClick={() => toggleLearnedPractice(practice.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm border
                                            ${learnedPracticesIds.has(practice.id)
                                                ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                                                : 'bg-blue-200 text-blue-800 border-blue-300 hover:bg-blue-300'}
                                            transform active:translate-y-0 active:shadow-sm transition-all
                                        `}
                                    >
                                        {practice.name} ({practice.duration} min)
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-lg shadow-inner">
                            <h2 className="text-blue-600 text-2xl font-semibold mb-4">Manually Add Practice</h2>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {yogaPractices.filter(p => learnedPracticesIds.has(p.id)).map(practice => (
                                    <button
                                        key={practice.id}
                                        onClick={() => addPracticeToSession(practice.id)}
                                        className="bg-blue-200 text-blue-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-blue-300 hover:bg-blue-300"
                                    >
                                        {practice.name} ({practice.duration} min)
                                    </button>
                                ))}
                                {learnedPracticesIds.size === 0 && (
                                    <p className="text-gray-600 text-sm">Select practices you've learned above to add them here.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[300px] flex flex-col gap-5">
                        <div className="bg-gray-50 p-5 rounded-lg shadow-inner">
                            <h2 className="text-blue-600 text-2xl font-semibold mb-4">Your Current Session</h2>
                            <div className="flex justify-center items-center gap-5 flex-wrap mt-4">
                                <p className="text-lg font-medium text-gray-700">Selected Time: <span className="font-bold text-teal-700">{currentTotalDuration}</span> min</p>
                                <p className="text-lg font-medium text-gray-700">Remaining Time: <span className="font-bold text-teal-700">{remainingTime}</span> min</p>
                                <button
                                    onClick={clearSession}
                                    className="bg-red-500 text-white px-5 py-2.5 rounded-md text-base font-semibold shadow-md hover:bg-red-600 transform active:translate-y-0 active:shadow-sm"
                                >
                                    Clear Session
                                </button>
                                <button
                                    onClick={getAISuggestion}
                                    className="bg-emerald-500 text-white px-5 py-2.5 rounded-md text-base font-semibold shadow-md hover:bg-emerald-600 transform active:translate-y-0 active:shadow-sm"
                                >
                                    ✨ Get AI Suggestion
                                </button>
                            </div>
                            {selectedPractices.length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-left">
                                    <h3 className="font-semibold text-blue-700 mb-2">Current Session Practices:</h3>
                                    <ul className="list-disc list-inside">
                                        {selectedPractices.map((p, index) => (
                                            <li key={p.id + index} className="mb-1">{p.name} ({p.duration} min)</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="suggestion-area mt-5 p-4 bg-emerald-50 border border-dashed border-emerald-300 rounded-lg flex flex-col justify-center items-center gap-2 min-h-[60px]">
                            {loadingAI ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    <p className="text-emerald-900 italic">Generating AI suggestion...</p>
                                </>
                            ) : aiSuggestion ? (
                                aiSuggestion.practice ? (
                                    <>
                                        <h3 className="text-emerald-900 text-lg font-semibold mt-0 mb-2">AI Suggestion</h3>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <button
                                                onClick={() => addPracticeToSession(aiSuggestion.practice.id)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 whitespace-nowrap"
                                            >
                                                Add: {aiSuggestion.practice.name} ({aiSuggestion.practice.duration} min)
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-emerald-900 italic">{aiSuggestion.message}</p>
                                )
                            ) : suggestedSessions.length > 0 ? (
                                <>
                                    <h3 className="text-emerald-900 text-lg font-semibold mt-0 mb-2">Suggested Sessions for {availableMinutes} minutes:</h3>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {suggestedSessions.slice(0, 15).map((combo, index) => (
                                            <button
                                                key={index}
                                                onClick={() => applySuggestedSession(combo.practices)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 whitespace-nowrap"
                                            >
                                                {combo.practices.map(p => p.name).join(' + ')} ({combo.totalDuration} min)
                                            </button>
                                        ))}
                                        {suggestedSessions.length > 15 && (
                                            <p className="text-emerald-900 italic text-sm">...and {suggestedSessions.length - 15} more combinations.</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-emerald-900 italic">No suitable combinations found for that time with your learned practices and sequence rules. Try adjusting your learned practices or available minutes!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Message Box */}
            {messageBox && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm border-2 border-blue-500">
                        <h3 className="text-xl font-semibold text-blue-600 mb-3">{messageBox.title}</h3>
                        <p className="text-gray-700 mb-5">{messageBox.message}</p>
                        <button
                            onClick={closeMessageBox}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
