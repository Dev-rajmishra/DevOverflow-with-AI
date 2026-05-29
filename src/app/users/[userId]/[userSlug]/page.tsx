import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import React from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { answerCollection, db, questionCollection } from "@/models/name";
import { Query } from "node-appwrite";
import { 
  IconFlame, 
  IconAward, 
  IconBug, 
  IconDatabase, 
  IconMarkdown, 
  IconThumbUp,
  IconCpu,
  IconTrophy
} from "@tabler/icons-react";

export default async function Page({
  params: paramsPromise,
}: {
  params: Promise<{ userId: string; userSlug: string }>;
}) {
  const params = await paramsPromise;
  
  const [user, questions, answers] = await Promise.all([
    users.get<UserPrefs>(params.userId),
    databases.listDocuments(db, questionCollection, [
      Query.equal("authorId", params.userId),
      Query.limit(1), // for optimization
    ]),
    databases.listDocuments(db, answerCollection, [
      Query.equal("authorId", params.userId),
      Query.limit(1), // for optimization
    ]),
  ]);

  // Gamification Metrics
  const reputation = Number(user.prefs.reputation || 0);
  const totalQuestions = questions.total;
  const totalAnswers = answers.total;

  const totalXP = reputation * 15 + totalQuestions * 10 + totalAnswers * 20;
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const nextLevelXP = currentLevel * 100;
  const prevLevelXP = (currentLevel - 1) * 100;
  const levelProgress = Math.min(100, Math.max(0, ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  // Mocked GitHub-style Contribution Grid (12 weeks x 7 days)
  const days = Array.from({ length: 84 }, (_, i) => {
    // Generate simulated contribution weights (0 = none, 1-4 = light to high)
    const seed = (i * 3 + reputation * 2 + totalQuestions * 5) % 10;
    if (seed < 4) return 0;
    if (seed < 7) return 1;
    if (seed < 9) return 2;
    return 3;
  });

  // Achievements/Badges logic
  const achievements = [
    {
      id: "appwrite_architect",
      name: "Appwrite Architect",
      desc: "Helped shape database environments with collections.",
      unlocked: reputation >= 2,
      icon: <IconDatabase className="w-6 h-6 text-indigo-400" />,
      color: "border-indigo-500/20 bg-indigo-500/5 shadow-indigo-500/5 text-indigo-400"
    },
    {
      id: "bug_hunter",
      name: "Bug Hunter",
      desc: "Successfully found and squashed code defects.",
      unlocked: totalAnswers >= 1 || reputation >= 5,
      icon: <IconBug className="w-6 h-6 text-emerald-400" />,
      color: "border-emerald-500/20 bg-emerald-500/5 shadow-emerald-500/5 text-emerald-400"
    },
    {
      id: "markdown_master",
      name: "Markdown Master",
      desc: "Wrote detailed Rich-Text technical descriptions.",
      unlocked: totalQuestions >= 1,
      icon: <IconMarkdown className="w-6 h-6 text-purple-400" />,
      color: "border-purple-500/20 bg-purple-500/5 shadow-purple-500/5 text-purple-400"
    },
    {
      id: "upvote_magnet",
      name: "Upvote Magnet",
      desc: "Earned significant upvotes from developers.",
      unlocked: reputation >= 15,
      icon: <IconThumbUp className="w-6 h-6 text-pink-400" />,
      color: "border-pink-500/20 bg-pink-500/5 shadow-pink-500/5 text-pink-400"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. GAMIFICATION LEVEL PROGRESS */}
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center font-bold">
                <span className="text-[10px] text-gray-500 leading-none">LVL</span>
                <span className="text-xl text-white leading-none mt-0.5">{currentLevel}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                Developer Progression
                <IconTrophy className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {totalXP} Total XP Earned · Streak Active <IconFlame className="w-3.5 h-3.5 text-orange-500 inline" />
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-gray-400">
            <span>{totalXP} XP</span> / <span className="text-white">{nextLevelXP} XP</span>
          </div>
        </div>

        {/* Progress gauge bar */}
        <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative p-0.5">
          <div 
            style={{ width: `${levelProgress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 transition-all duration-500" 
          />
        </div>
      </div>

      {/* 2. REPUTATION & INTERACTIVE STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MagicCard className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden p-8 shadow-2xl min-h-[180px]">
          <div className="absolute inset-x-4 top-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-500 font-mono">Reputation</h2>
          </div>
          <p className="z-10 whitespace-nowrap text-5xl font-extrabold text-gray-800 dark:text-gray-100 font-mono">
            <NumberTicker value={reputation} />
          </p>
          <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.15),rgba(255,255,255,0))]" />
        </MagicCard>

        <MagicCard className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden p-8 shadow-2xl min-h-[180px]">
          <div className="absolute inset-x-4 top-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-500 font-mono">Questions asked</h2>
          </div>
          <p className="z-10 whitespace-nowrap text-5xl font-extrabold text-gray-800 dark:text-gray-100 font-mono">
            <NumberTicker value={totalQuestions} />
          </p>
          <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
        </MagicCard>

        <MagicCard className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden p-8 shadow-2xl min-h-[180px]">
          <div className="absolute inset-x-4 top-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-500 font-mono">Answers given</h2>
          </div>
          <p className="z-10 whitespace-nowrap text-5xl font-extrabold text-gray-800 dark:text-gray-100 font-mono">
            <NumberTicker value={totalAnswers} />
          </p>
          <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.15),rgba(255,255,255,0))]" />
        </MagicCard>
      </div>

      {/* 3. CONTRIBUTIONS ACTIVITY HEATMAP */}
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <h3 className="text-sm font-bold uppercase text-gray-400 font-mono mb-4">
          Contribution Heatmap
        </h3>
        
        {/* Heatmap grid */}
        <div className="flex flex-wrap gap-1.5 p-4 rounded-xl border border-white/5 bg-black/40 w-full justify-between overflow-x-auto select-none">
          {days.map((level, i) => {
            const colors = [
              "bg-white/5 border-white/[0.02]",             // 0
              "bg-emerald-500/20 border-emerald-500/10",    // 1
              "bg-emerald-500/50 border-emerald-500/25",    // 2
              "bg-emerald-500/90 border-emerald-500/40"     // 3
            ];
            return (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-[3px] border ${colors[level]} transition-all`}
                title={`${level === 0 ? "No" : level * 2} contributions today`}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-3 px-1">
          <span>Less active</span>
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-white/5 border border-white/[0.02]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/20" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/50" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/90" />
          </div>
          <span>More active</span>
        </div>
      </div>

      {/* 4. BADGES / ACHIEVEMENTS GRID */}
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <h3 className="text-sm font-bold uppercase text-gray-400 font-mono mb-6 flex items-center gap-1.5">
          <IconAward className="w-5 h-5 text-indigo-400" />
          Developer Badges & Achievements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((badge) => (
            <div 
              key={badge.id}
              className={`flex items-start gap-4 rounded-xl border p-4 shadow-lg transition-all duration-200 ${
                badge.unlocked 
                  ? `${badge.color} border-opacity-40` 
                  : "border-white/5 bg-white/[0.02] opacity-40 select-none"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {badge.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">{badge.name}</h4>
                <p className="text-xs text-gray-400 leading-normal">{badge.desc}</p>
                <div className="pt-1.5">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    badge.unlocked 
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
                      : "border-white/10 bg-white/5 text-gray-500"
                  }`}>
                    {badge.unlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
