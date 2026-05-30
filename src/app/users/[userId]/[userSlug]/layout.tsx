import { avatars } from "@/models/client/config";
import { users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import convertDateToRelativeTime from "@/utils/relativeTime";
import React from "react";
import EditButton from "./EditButton";
import Navbar from "./Navbar";
import {
  IconClockFilled,
  IconUserFilled,
  IconBrandGithub,
  IconBrandTwitter,
  IconGlobe,
  IconDatabase,
  IconBug,
  IconMarkdown,
  IconThumbUp
} from "@tabler/icons-react";

const Layout = async ({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string; userSlug: string }>;
}) => {
  const params = await paramsPromise;
  const user = await users.get<UserPrefs>(params.userId);

  // Retrieve customized preferences
  const bio = user.prefs?.bio;
  const techStack = user.prefs?.techStack || [];
  const github = user.prefs?.github;
  const twitter = user.prefs?.twitter;
  const portfolio = user.prefs?.portfolio;
  const badge = user.prefs?.badge;

  // Visual definition for equipped title badges
  const renderBadge = () => {
    if (!badge) return null;

    let badgeStyle = "border-white/10 bg-white/5 text-gray-400";
    let icon = null;

    if (badge === "Appwrite Architect") {
      badgeStyle = "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
      icon = <IconDatabase className="w-3 h-3 inline mr-1" />;
    } else if (badge === "Bug Hunter") {
      badgeStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
      icon = <IconBug className="w-3 h-3 inline mr-1" />;
    } else if (badge === "Markdown Master") {
      badgeStyle = "border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
      icon = <IconMarkdown className="w-3 h-3 inline mr-1" />;
    } else if (badge === "Upvote Magnet") {
      badgeStyle = "border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]";
      icon = <IconThumbUp className="w-3 h-3 inline mr-1" />;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeStyle} animate-pulse shrink-0`}>
        {icon}
        {badge}
      </span>
    );
  };

  return (
    <div className="container mx-auto space-y-6 px-4 pb-20 pt-32 relative">
      <div className="absolute top-0 right-0 w-75 h-75 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex flex-col gap-6 sm:flex-row items-start rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-y-0 left-0 w-1 bg-linear-to-b from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="w-36 h-36 shrink-0 rounded-2xl border border-white/10 overflow-hidden bg-slate-900 shadow-xl">
          <picture className="block w-full h-full">
            <img
              src={user.prefs?.profileImage || avatars.getInitials(user.name, 200, 200)}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          </picture>
        </div>

        <div className="w-full space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-extrabold text-white leading-none tracking-tight">{user.name}</h1>
                {renderBadge()}
              </div>
              <p className="text-sm font-mono text-gray-500">{user.email}</p>
            </div>
            
            <div className="shrink-0 flex items-center gap-3">
              <EditButton />
            </div>
          </div>

          {/* User Bio */}
          {bio && (
            <p className="text-sm text-gray-300 font-mono italic max-w-2xl border-l-2 border-indigo-500/40 pl-3 leading-relaxed">
              "{bio}"
            </p>
          )}

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-gray-400">
            <p className="flex items-center gap-1.5">
              <IconUserFilled className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Dropped {convertDateToRelativeTime(new Date(user.$createdAt))}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <IconClockFilled className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Last active {convertDateToRelativeTime(new Date(user.$updatedAt))}</span>
            </p>
          </div>

          {/* Tech Stack Tags & Socials */}
          {(techStack.length > 0 || github || twitter || portfolio) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {techStack.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded border border-white/5 bg-white/5 text-[10px] font-mono text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 text-gray-400">
                {github && (
                  <a
                    href={github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                    title="GitHub Profile"
                  >
                    <IconBrandGithub className="w-4 h-4" />
                  </a>
                )}
                {twitter && (
                  <a
                    href={twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                    title="Twitter / X Profile"
                  >
                    <IconBrandTwitter className="w-4 h-4" />
                  </a>
                )}
                {portfolio && (
                  <a
                    href={portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                    title="Portfolio / Website"
                  >
                    <IconGlobe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row items-start">
        <Navbar />
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
