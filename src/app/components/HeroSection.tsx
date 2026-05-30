import React from "react";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { getCachedLatestQuestions } from "@/utils/cache";
import slugify from "@/utils/slugify";
import { storage } from "@/models/client/config";
import HeroSectionHeader from "./HeroSectionHeader";
import { questionAttachmentBucket } from "@/models/name";

export default async function HeroSection() {
  const questions = await getCachedLatestQuestions(15);

  let products = questions.documents.map((q: any) => ({
    title: q.title,
    link: `/questions/${q.$id}/${slugify(q.title)}`,
    thumbnail: q.attachmentId 
      ? (q.attachmentId.startsWith("c:")
          ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlpkssnph"}/image/upload/${q.attachmentId.slice(2)}`
          : q.attachmentId.startsWith("http")
            ? q.attachmentId
            : storage.getFilePreview(questionAttachmentBucket, q.attachmentId))
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  }));

  if (products.length === 0) {
    products = [
      {
        title: "Getting Started with React 19",
        link: "/questions",
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Mastering Next.js App Router",
        link: "/questions",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Appwrite Database Schema Design",
        link: "/questions",
        thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Understanding Zustand Middlewares",
        link: "/questions",
        thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Tailwind CSS v4 New Features",
        link: "/questions",
        thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
      }
    ];
  }

  return (
    <HeroParallax
      header={<HeroSectionHeader />}
      products={products}
    />
  );
}
