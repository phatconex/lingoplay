(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://zgqvyxxzevllwrvhptsn.supabase.co") || 'placeholder_url';
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncXZ5eHh6ZXZsbHdydmhwdHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzkyNDQsImV4cCI6MjA5MTYxNTI0NH0.c5rzRtuu6pSXQhv6MMJgx8JwiletuOZD7wGFR4ITuHc") || 'placeholder_key';
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/store.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppProvider",
    ()=>AppProvider,
    "useAppContext",
    ()=>useAppContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const STORAGE_KEY = 'vocavibe_data';
const initialAppData = {
    vocab: [],
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: null,
    completedModes: {}
};
const AppContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AppProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [authLoading, setAuthLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [appData, setAppData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialAppData);
    const [activeSet, setActiveSet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [feedback, setFeedback] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        show: false,
        title: '',
        type: '',
        subtitle: '',
        duration: 3000
    });
    // Load from local storage initially
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    setAppData({
                        "AppProvider.useEffect": (prev)=>({
                                ...prev,
                                ...JSON.parse(saved)
                            })
                    }["AppProvider.useEffect"]);
                } catch (e) {
                    console.error(e);
                }
            }
            try {
                const savedModes = JSON.parse(localStorage.getItem('vocavibe_completed_modes') || '{}');
                setAppData({
                    "AppProvider.useEffect": (prev)=>({
                            ...prev,
                            completedModes: savedModes
                        })
                }["AppProvider.useEffect"]);
            } catch (e) {}
        }
    }["AppProvider.useEffect"], []);
    // Auth state listener
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then({
                "AppProvider.useEffect": ({ data: { session } })=>{
                    setUser(session?.user ?? null);
                    setAuthLoading(false);
                }
            }["AppProvider.useEffect"]);
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AppProvider.useEffect": (_event, session)=>{
                    setUser(session?.user ?? null);
                    setAuthLoading(false);
                }
            }["AppProvider.useEffect"]);
            return ({
                "AppProvider.useEffect": ()=>subscription.unsubscribe()
            })["AppProvider.useEffect"];
        }
    }["AppProvider.useEffect"], []);
    // Sync to DB helper
    const syncProfileToDB = async (userId, streak, lastStudyDate, xp)=>{
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
            streak,
            last_study_date: lastStudyDate,
            xp,
            updated_at: new Date().toISOString()
        }).eq('id', userId);
        if (error) console.error('Failed to sync profile to DB:', error);
    };
    // Load profile from DB
    const loadProfileFromDB = async (userId)=>{
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('streak, last_study_date, xp').eq('id', userId).single();
        if (error) {
            console.warn('Could not load profile, using local cache:', error.message);
            return;
        }
        if (data) {
            setAppData((prev)=>({
                    ...prev,
                    streak: data.streak ?? prev.streak,
                    lastStudyDate: data.last_study_date ?? prev.lastStudyDate,
                    xp: data.xp ?? prev.xp
                }));
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            if (!user) return;
            loadProfileFromDB(user.id);
        }
    }["AppProvider.useEffect"], [
        user
    ]);
    // Save to localStorage on changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProvider.useEffect": ()=>{
            if (("TURBOPACK compile-time value", "object") !== 'undefined' && appData !== initialAppData) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
            }
        }
    }["AppProvider.useEffect"], [
        appData
    ]);
    const showFeedback = (title, type, subtitle = '', duration = 3000)=>{
        setFeedback({
            show: true,
            title,
            type,
            subtitle,
            duration
        });
    };
    const hideFeedback = ()=>setFeedback((prev)=>({
                ...prev,
                show: false
            }));
    const checkStreak = ()=>{
        setAppData((prev)=>{
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastDate = prev.lastStudyDate ? new Date(prev.lastStudyDate) : null;
            if (lastDate) lastDate.setHours(0, 0, 0, 0);
            const diffDays = lastDate ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            if (diffDays > 1) {
                if (user) syncProfileToDB(user.id, 0, prev.lastStudyDate, prev.xp);
                return {
                    ...prev,
                    streak: 0
                };
            }
            return prev;
        });
    };
    const updateStreakAfterStudy = ()=>{
        const todayStr = new Date().toDateString();
        setAppData((prev)=>{
            if (prev.lastStudyDate === todayStr) return prev;
            const newStreak = (prev.streak || 0) + 1;
            const next = {
                ...prev,
                streak: newStreak,
                lastStudyDate: todayStr
            };
            if (user) syncProfileToDB(user.id, newStreak, todayStr, prev.xp);
            return next;
        });
    };
    const updateWordStats = (id, isCorrect)=>{
        setAppData((prev)=>{
            const newVocab = prev.vocab.map((word)=>{
                if (word.id === id) {
                    if (isCorrect) {
                        return {
                            ...word,
                            mastery: Math.min(100, (word.mastery || 0) + 10)
                        };
                    } else {
                        return {
                            ...word,
                            wrongCount: (word.wrongCount || 0) + 1
                        };
                    }
                }
                return word;
            });
            return {
                ...prev,
                vocab: newVocab
            };
        });
    };
    const updateSetLastStudied = async (setId)=>{
        if (!user || !setId) return;
        const SRS_INTERVALS = [
            0,
            1,
            2,
            4,
            7,
            30
        ];
        const { data: currentData, error: fetchError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('vocabulary_sets').select('review_count').eq('id', setId).eq('user_id', user.id).single();
        if (fetchError) {
            console.error('SRS: Failed to fetch current review_count:', fetchError);
            return;
        }
        const currentCount = currentData?.review_count ?? 0;
        const newCount = currentCount + 1;
        const daysUntilNext = SRS_INTERVALS[newCount] ?? 30;
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNext);
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('vocabulary_sets').update({
            last_studied: new Date().toISOString(),
            review_count: newCount,
            study_count: newCount,
            next_review: nextReviewDate.toISOString()
        }).eq('id', setId).eq('user_id', user.id);
        if (error) console.error('SRS Update Error:', error);
    };
    const markGameCompleted = async (setId, gameType)=>{
        if (!setId) return;
        const today = new Date().toDateString();
        const MODES_KEY = 'vocavibe_completed_modes';
        let progress = {};
        if ("TURBOPACK compile-time truthy", 1) {
            try {
                progress = JSON.parse(localStorage.getItem(MODES_KEY) || '{}');
            } catch (e) {}
        }
        let setProg = progress[setId] ? {
            ...progress[setId]
        } : {
            date: today,
            mc: false,
            spelling: false
        };
        if (setProg.date !== today) {
            setProg = {
                date: today,
                mc: false,
                spelling: false
            };
        }
        const wasCompletedToday = setProg.mc && setProg.spelling;
        setProg[gameType] = true;
        progress[setId] = setProg;
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.setItem(MODES_KEY, JSON.stringify(progress));
        }
        setAppData((prev)=>({
                ...prev,
                completedModes: {
                    ...progress
                }
            }));
        if (setProg.mc && setProg.spelling && !wasCompletedToday) {
            await updateSetLastStudied(setId);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppContext.Provider, {
        value: {
            user,
            setUser,
            authLoading,
            appData,
            setAppData,
            activeSet,
            setActiveSet,
            feedback,
            showFeedback,
            hideFeedback,
            checkStreak,
            updateStreakAfterStudy,
            updateWordStats,
            updateSetLastStudied,
            markGameCompleted
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/store.tsx",
        lineNumber: 249,
        columnNumber: 5
    }, this);
}
_s(AppProvider, "yaqP+SlH8klOLpLw6Bk3z8dsc8A=");
_c = AppProvider;
const useAppContext = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
_s1(useAppContext, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AppProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_0ongu2g._.js.map