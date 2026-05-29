"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/Auth";
import slugify from "@/utils/slugify";
import { databases } from "@/models/client/config";
import { db, questionCollection } from "@/models/name";
import { Query } from "appwrite";
import { 
  IconSearch, 
  IconPlus, 
  IconLayoutDashboard, 
  IconUser, 
  IconSun, 
  IconCommand,
  IconCornerDownLeft,
  IconArticle
} from "@tabler/icons-react";

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Global escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Live searching Appwrite questions
  React.useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(db, questionCollection, [
          Query.search("title", query),
          Query.limit(5)
        ]);
        setResults(response.documents);
        setActiveIndex(0);
      } catch (error) {
        console.error("Error searching in command palette:", error);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Handle key navigation (arrows & enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const actionsCount = staticActions.length;
    const totalItems = results.length + actionsCount;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < results.length) {
        const selectedQ = results[activeIndex];
        router.push(`/questions/${selectedQ.$id}/${slugify(selectedQ.title)}`);
        onClose();
      } else {
        const staticIndex = activeIndex - results.length;
        staticActions[staticIndex].action();
      }
    }
  };

  // Static actions
  const staticActions = React.useMemo(() => {
    const actions = [
      {
        name: "Ask a public question",
        icon: <IconPlus className="w-5 h-5 text-emerald-400" />,
        action: () => {
          router.push("/questions/ask");
          onClose();
        }
      },
      {
        name: "View all questions",
        icon: <IconSearch className="w-5 h-5 text-indigo-400" />,
        action: () => {
          router.push("/questions");
          onClose();
        }
      },
      {
        name: "Developer Dashboard",
        icon: <IconLayoutDashboard className="w-5 h-5 text-cyan-400" />,
        action: () => {
          router.push("/dashboard");
          onClose();
        }
      }
    ];

    if (user) {
      actions.push({
        name: "Go to your Profile",
        icon: <IconUser className="w-5 h-5 text-purple-400" />,
        action: () => {
          router.push(`/users/${user.$id}/${slugify(user.name)}`);
          onClose();
        }
      });
    }

    return actions;
  }, [user, router, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-start justify-center pt-[15vh]">
        {/* Dark blur overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Palette Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-indigo-500/10 flex flex-col"
        >
          {/* Neon gradient line top */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Search Input bar */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <IconSearch className="w-6 h-6 text-gray-400" />
            <input 
              ref={inputRef}
              type="text"
              placeholder="Search questions or run global commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-white outline-none border-none text-lg placeholder-gray-500 font-sans"
            />
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs text-gray-400 font-mono">
              <IconCommand className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
            {/* Live Search Section */}
            {loading && (
              <div className="py-4 text-center text-sm text-gray-400">
                Searching DevOverflow...
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Questions
                </div>
                {results.map((q, idx) => {
                  const isSelected = activeIndex === idx;
                  return (
                    <div 
                      key={q.$id}
                      onClick={() => {
                        router.push(`/questions/${q.$id}/${slugify(q.title)}`);
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                        isSelected ? "bg-white/10 text-white" : "text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconArticle className={`w-5 h-5 ${isSelected ? "text-orange-400" : "text-gray-500"}`} />
                        <span className="text-sm font-medium line-clamp-1">{q.title}</span>
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-0.5 text-xs text-gray-400 font-mono">
                          <span>Enter</span>
                          <IconCornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Static Commands Section */}
            <div>
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Commands & Shortcuts
              </div>
              {staticActions.map((action, idx) => {
                const actualIndex = results.length + idx;
                const isSelected = activeIndex === actualIndex;
                return (
                  <div 
                    key={action.name}
                    onClick={action.action}
                    onMouseEnter={() => setActiveIndex(actualIndex)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                      isSelected ? "bg-white/10 text-white" : "text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {action.icon}
                      <span className="text-sm font-medium">{action.name}</span>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400 font-mono">
                        <span>Enter</span>
                        <IconCornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
