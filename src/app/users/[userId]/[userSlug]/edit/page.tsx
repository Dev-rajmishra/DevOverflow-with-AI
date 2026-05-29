"use client";

import React, { useState, useEffect, use } from "react";
import { useAuthStore, UserPrefs } from "@/store/Auth";
import { account, avatars } from "@/models/client/config";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { toast } from "@/store/Toast";
import {
  IconArrowLeft,
  IconUser,
  IconFileText,
  IconBrandGithub,
  IconBrandTwitter,
  IconGlobe,
  IconDeviceLaptop,
  IconAward,
  IconLoader2,
  IconFlame,
  IconDatabase,
  IconBug,
  IconMarkdown,
  IconThumbUp
} from "@tabler/icons-react";

interface PageProps {
  params: Promise<{ userId: string; userSlug: string }>;
}

const AVAILABLE_TAGS = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Tailwind CSS",
  "Appwrite",
  "Docker",
  "GraphQL",
  "PostgreSQL",
  "MongoDB",
  "C++",
  "AWS"
];

export default function Page({ params: paramsPromise }: PageProps) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Gamification stats to evaluate badge unlocking
  const reputation = user?.prefs?.reputation || 0;
  const isArchitectUnlocked = reputation >= 2;
  const isBugHunterUnlocked = reputation >= 5;
  const isMarkdownMasterUnlocked = true; // All active contributors get this
  const isUpvoteMagnetUnlocked = reputation >= 15;

  useEffect(() => {
    if (hydrated) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/login");
        return;
      }

      if (user.$id !== params.userId) {
        // Access Denied
        setError("Access Denied: You do not have permissions to edit this profile.");
        setInitialLoading(false);
        return;
      }

      // Pre-fill form from user attributes and preferences
      setName(user.name || "");
      setBio(user.prefs?.bio || "");
      setSelectedTags(user.prefs?.techStack || []);
      setGithub(user.prefs?.github || "");
      setTwitter(user.prefs?.twitter || "");
      setPortfolio(user.prefs?.portfolio || "");
      setSelectedBadge(user.prefs?.badge || "");
      setProfileImage(user.prefs?.profileImage || "");
      setInitialLoading(false);
    }
  }, [hydrated, user, params.userId, router]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast("Uploading avatar to Cloudinary...", "info");
    try {
      const secureUrl = await uploadToCloudinary(file);
      setProfileImage(secureUrl);
      toast("Avatar uploaded successfully!", "success");
    } catch (err: any) {
      console.error(err);
      toast(err?.message || "Failed to upload avatar", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Display Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update full display name in Appwrite account authentication
      if (name !== user?.name) {
        await account.updateName(name);
      }

      // 2. Build custom user preferences while preserving reputation
      const updatedPrefs: UserPrefs = {
        reputation: reputation,
        bio: bio.trim(),
        techStack: selectedTags,
        github: github.trim(),
        twitter: twitter.trim(),
        portfolio: portfolio.trim(),
        badge: selectedBadge,
        profileImage: profileImage
      };

      // Save preferences to Appwrite
      await account.updatePrefs<UserPrefs>(updatedPrefs);

      // 3. Get fresh updated user object and update Zustand store in real-time
      const freshUser = await account.get<UserPrefs>();
      useAuthStore.setState({ user: freshUser });

      // 4. Trigger premium confetti celebrations
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#3b82f6"]
      });

      setSuccess(true);
      setLoading(false);

      // Redirect back to profile page after delay
      setTimeout(() => {
        router.push(`/users/${params.userId}/${params.userSlug}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to update profile settings.");
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 pb-20 pt-32 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <IconLoader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-gray-400 font-mono text-sm">Hydrating Developer Profile Settings...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto max-w-xl px-4 pb-20 pt-32 text-center space-y-6">
        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-white">Authorization Error</h2>
          <p className="text-sm text-gray-400 font-mono leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => router.push(`/users/${params.userId}/${params.userSlug}`)}
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 pb-20 pt-32 space-y-8 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header back bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => router.push(`/users/${params.userId}/${params.userSlug}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
        >
          <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Profile</span>
        </button>
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Settings / Edit
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Visual Profile Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-xl p-6 shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-white/10 p-0.5 bg-slate-900 shadow-xl">
              <img
                src={profileImage || avatars.getInitials(name || user?.name || "User", 200, 200)}
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            
            {/* Premium Avatar Uploader */}
            <div className="pt-1">
              <label className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10 hover:border-white/20 bg-white/5 rounded-lg py-1 px-2.5">
                <span>Upload Avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-white text-lg truncate">{name || "Anonymous Dev"}</h3>
              <p className="text-xs font-mono text-indigo-400">{user?.email}</p>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                <span>Reputation</span>
                <span className="text-white font-bold">{reputation}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                <span>Primary Badge</span>
                <span className="text-indigo-400 font-bold max-w-[120px] truncate text-right">
                  {selectedBadge || "None equipped"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 font-mono text-[11px] text-gray-500 leading-normal space-y-2">
            <p className="font-bold text-gray-400 flex items-center gap-1.5">
              <IconFlame className="w-3.5 h-3.5 text-orange-500" /> Developer Tips
            </p>
            <p>Your equipped primary badge will render prominently with a custom neon border on your public Developer profile.</p>
            <p>Unlock premium badges by writing detailed descriptions, resolving questions, and earning community upvotes.</p>
          </div>
        </div>

        {/* Right Column: Profile Edit Form */}
        <div className="md:col-span-2 space-y-6">
          {error && (
            <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 text-sm text-red-400 font-mono">
              {error}
            </div>
          )}

          {success && (
            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 text-sm text-emerald-400 font-mono text-center font-bold animate-pulse">
              🎉 Profile successfully overhauled! Synced with DevOverflow core.
            </div>
          )}

          <form onSubmit={handleSave} className="rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md p-6 md:p-8 space-y-6 shadow-2xl">
            
            {/* 1. Full Display Name */}
            <div className="space-y-2">
              <label htmlFor="name-input" className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <IconUser className="w-3.5 h-3.5 text-indigo-400" /> Display Name
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linus Torvalds"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono outline-none"
              />
            </div>

            {/* 2. Custom Bio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="bio-input" className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <IconFileText className="w-3.5 h-3.5 text-purple-400" /> Bio Summary
                </label>
                <span className="text-[10px] font-mono text-gray-500">
                  {bio.length}/200
                </span>
              </div>
              <textarea
                id="bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Write a brief professional description, favorite frameworks, or what you are hacking on..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono outline-none resize-none leading-relaxed"
              />
            </div>

            {/* 3. Tech Stack Tags */}
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <IconDeviceLaptop className="w-3.5 h-3.5 text-emerald-400" /> Tech Stack
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                        isSelected
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Gamified Badge Selection */}
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <IconAward className="w-3.5 h-3.5 text-pink-400" /> Equipped Title Badge
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Badge Options */}
                {[
                  {
                    id: "Appwrite Architect",
                    unlocked: isArchitectUnlocked,
                    requirement: "Requires >= 2 reputation",
                    icon: <IconDatabase className="w-4 h-4" />,
                    color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400"
                  },
                  {
                    id: "Bug Hunter",
                    unlocked: isBugHunterUnlocked,
                    requirement: "Requires >= 5 reputation",
                    icon: <IconBug className="w-4 h-4" />,
                    color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                  },
                  {
                    id: "Markdown Master",
                    unlocked: isMarkdownMasterUnlocked,
                    requirement: "Unlocked for active contributors",
                    icon: <IconMarkdown className="w-4 h-4" />,
                    color: "border-purple-500/30 bg-purple-500/5 text-purple-400"
                  },
                  {
                    id: "Upvote Magnet",
                    unlocked: isUpvoteMagnetUnlocked,
                    requirement: "Requires >= 15 reputation",
                    icon: <IconThumbUp className="w-4 h-4" />,
                    color: "border-pink-500/30 bg-pink-500/5 text-pink-400"
                  }
                ].map((badge) => {
                  const isEquipped = selectedBadge === badge.id;
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      disabled={!badge.unlocked}
                      onClick={() => setSelectedBadge(badge.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        !badge.unlocked
                          ? "opacity-30 cursor-not-allowed border-white/5 bg-transparent"
                          : isEquipped
                          ? `${badge.color} ring-1 ring-indigo-500`
                          : "border-white/10 bg-black/20 text-gray-300 hover:border-white/20"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">{badge.icon}</div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold font-mono">{badge.id}</div>
                        <div className="text-[9px] font-mono text-gray-500 leading-none">
                          {badge.unlocked ? "Unlocked & ready" : badge.requirement}
                        </div>
                      </div>
                      {badge.unlocked && isEquipped && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedBadge && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedBadge("")}
                    className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors"
                  >
                    Clear equipped badge
                  </button>
                </div>
              )}
            </div>

            {/* 5. Social Connections */}
            <div className="space-y-4 pt-2 border-t border-white/5">
              <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <IconGlobe className="w-3.5 h-3.5 text-blue-400" /> Social Integrations
              </label>

              <div className="grid grid-cols-1 gap-4">
                {/* GitHub */}
                <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-500 transition-all">
                  <span className="flex items-center justify-center px-3 border-r border-white/10 bg-white/5 text-gray-400">
                    <IconBrandGithub className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-4 py-2.5 text-xs text-white placeholder-gray-600 bg-transparent font-mono outline-none"
                  />
                </div>

                {/* Twitter */}
                <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-500 transition-all">
                  <span className="flex items-center justify-center px-3 border-r border-white/10 bg-white/5 text-gray-400">
                    <IconBrandTwitter className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                    className="w-full px-4 py-2.5 text-xs text-white placeholder-gray-600 bg-transparent font-mono outline-none"
                  />
                </div>

                {/* Portfolio */}
                <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-500 transition-all">
                  <span className="flex items-center justify-center px-3 border-r border-white/10 bg-white/5 text-gray-400">
                    <IconGlobe className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://yourwebsite.dev"
                    className="w-full px-4 py-2.5 text-xs text-white placeholder-gray-600 bg-transparent font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 6. Form Submission */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full relative group overflow-hidden rounded-xl border border-white/20 bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synchronizing Prefs...</span>
                  </>
                ) : success ? (
                  <span>Overhauled! Redirecting...</span>
                ) : (
                  <>
                    <span>Commit Settings</span>
                    <span className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
