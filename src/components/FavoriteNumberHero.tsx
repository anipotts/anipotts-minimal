"use client";

import { useState, useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { motion, AnimatePresence } from "framer-motion";

type Stats = {
  yourNumber: number;
  totalResponses: number;
  topNumbers: { number: number; count: number; percent: number }[];
};

export default function FavoriteNumberHero() {
  const posthog = usePostHog();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  // Check if already submitted on mount (simple cookie check wrapper or localstorage)
  // Since HttpOnly cookie is used for ID, we might not see it easily in JS.
  // But we can check a local flag or just let the API handle the logic of "returning user".
  // For better UX under "one answer per browser", let's use localStorage to remember state B.
  useEffect(() => {
    const savedStats = localStorage.getItem("favoriteNumberStats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
      setHasSubmitted(true);
    }
    
    // Track seen event
    posthog.capture("favorite_number_seen", {
      pathname: window.location.pathname,
      viewport_width: window.innerWidth,
    });
  }, [posthog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number) return;
    
    const numVal = parseInt(number, 10);
    if (isNaN(numVal)) {
      setError("integers only.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/favorite-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: numVal }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      const data: Stats = await res.json();
      setStats(data);
      setHasSubmitted(true);
      localStorage.setItem("favoriteNumberStats", JSON.stringify(data));

      posthog.capture("favorite_number_submitted", {
        number: numVal,
        total_responses: data.totalResponses,
        is_mobile: window.innerWidth < 768,
      });

    } catch (err) {
      console.error(err);
      setError("something went wrong. try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-mono text-base md:text-lg text-gray-400">
      <AnimatePresence mode="wait">
        {!hasSubmitted ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <p className="leading-relaxed">
              while you're here, what's your favorite number?
              <br />
              mine's 15.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="enter a number"
                className="bg-gray-900/50 border border-gray-800 text-gray-100 px-4 py-2 rounded-md focus:outline-none focus:border-accent-500 w-full md:w-48 placeholder:text-gray-600 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "..." : "submit"}
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </motion.div>
        ) : (
          <motion.div
             key="stats"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3 }}
             className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
               <p>
                 nice. you picked <span className="text-accent-400 font-bold">{stats?.yourNumber}</span>.
               </p>
               <p>
                 you're 1 of {stats?.totalResponses?.toLocaleString()} people who've answered so far.
               </p>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <p className="mb-2">most loved numbers right now:</p>
              {stats?.topNumbers.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-right text-gray-500">{item.number}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="h-4 bg-gray-700/50 relative overflow-hidden flex items-center"
                      style={{ width: `${Math.max(item.percent * 3, 5)}%`, minWidth: '20px' }} // Scale factor for visuals
                    >
                         <span className="text-[10px] text-gray-500 absolute left-1">▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span> 
                         {/* ASCII-ish simulation using text overflow or just solid block? 
                             User asked for "ASCII bar" (blocks). 
                             Let's use a string of block characters clipped by the container width. 
                         */}
                    </div>
                    <span className="text-gray-500">{Math.round(item.percent)}%</span>
                  </div>
                </div>
              ))}
               {/* "Other" category is tricky unless backend returns it. 
                   Plan said "Top 5". I will just show top 5. 
                   If user insists on "other", I'd need to calculate 100 - sum(top 5).
                   I'll add "other" IF the sum is < 100 significantly. 
               */}
               {(() => {
                 const sum = stats?.topNumbers.reduce((acc, curr) => acc + curr.percent, 0) || 0;
                 const other = 100 - sum;
                 if (other > 1) {
                   return (
                     <div className="flex items-center gap-3 text-sm">
                        <span className="w-8 text-right text-gray-500">other</span>
                        <div className="flex items-center gap-2 flex-1">
                           <div className="h-4 bg-gray-700/30 relative overflow-hidden" style={{ width: `${Math.max(other * 3, 5)}%` }}>
                              <span className="text-[10px] text-gray-600 absolute left-1">▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>
                           </div>
                           <span className="text-gray-500">{Math.round(other)}%</span>
                        </div>
                     </div>
                   )
                 }
               })()}
            </div>
            
            <p className="text-xs text-gray-600 mt-2">// stats refresh whenever someone new answers.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
