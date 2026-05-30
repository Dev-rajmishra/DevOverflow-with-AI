import { cache as reactCache } from "react";
import { unstable_cache } from "next/cache";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import {
  db,
  questionCollection,
  answerCollection,
  commentCollection,
  voteCollection,
} from "@/models/name";
import { Query } from "node-appwrite";

/**
 * Caches a user profile fetched from Appwrite.
 * Available on both server and client components (via next/cache Data Cache).
 * Revalidates every 10 minutes.
 */
export const getCachedUser = reactCache(
  async (userId: string) => {
    return unstable_cache(
      async () => {
        try {
          const user = await users.get<UserPrefs>(userId);
          return JSON.parse(JSON.stringify(user));
        } catch (error) {
          console.error(`Error fetching user ${userId} in cache:`, error);
          return {
            $id: userId,
            name: "Anonymous User",
            email: "",
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString(),
            prefs: {
              reputation: 0,
              bio: "",
              techStack: [],
              github: "",
              twitter: "",
              portfolio: "",
              badge: "",
              profileImage: "",
            },
          };
        }
      },
      [`user-profile-${userId}`],
      {
        revalidate: 600, // 10 minutes
        tags: [`user-${userId}`, "users"],
      }
    )();
  }
);

/**
 * Caches a single question document by its ID.
 */
export const getCachedQuestion = reactCache(
  async (questionId: string) => {
    return unstable_cache(
      async () => {
        try {
          const doc = await databases.getDocument(db, questionCollection, questionId);
          return JSON.parse(JSON.stringify(doc));
        } catch (error) {
          console.error(`Error fetching question ${questionId} in cache:`, error);
          throw error;
        }
      },
      [`question-detail-${questionId}`],
      {
        revalidate: 600,
        tags: [`question-${questionId}`, "questions"],
      }
    )();
  }
);

/**
 * Caches all answers to a specific question.
 */
export const getCachedAnswers = reactCache(
  async (questionId: string) => {
    return unstable_cache(
      async () => {
        try {
          const answers = await databases.listDocuments(db, answerCollection, [
            Query.orderDesc("$createdAt"),
            Query.equal("questionId", questionId),
          ]);
          return JSON.parse(JSON.stringify(answers));
        } catch (error) {
          console.error(`Error fetching answers for question ${questionId}:`, error);
          return { total: 0, documents: [] };
        }
      },
      [`question-answers-${questionId}`],
      {
        revalidate: 600,
        tags: [`question-${questionId}`, `answers-${questionId}`, "answers"],
      }
    )();
  }
);

/**
 * Caches comments for a specific document (question or answer).
 */
export const getCachedComments = reactCache(
  async (type: "question" | "answer", typeId: string) => {
    return unstable_cache(
      async () => {
        try {
          const comments = await databases.listDocuments(db, commentCollection, [
            Query.equal("type", type),
            Query.equal("typeId", typeId),
            Query.orderDesc("$createdAt"),
          ]);
          return JSON.parse(JSON.stringify(comments));
        } catch (error) {
          console.error(`Error fetching comments for ${type} ${typeId}:`, error);
          return { total: 0, documents: [] };
        }
      },
      [`comments-${type}-${typeId}`],
      {
        revalidate: 600,
        tags: [`question-${typeId}`, `comments-${typeId}`, "comments"],
      }
    )();
  }
);

/**
 * Caches vote documents and totals for a question or answer.
 */
export const getCachedVotes = reactCache(
  async (type: "question" | "answer", typeId: string) => {
    return unstable_cache(
      async () => {
        try {
          const [upvotes, downvotes] = await Promise.all([
            databases.listDocuments(db, voteCollection, [
              Query.equal("typeId", typeId),
              Query.equal("type", type),
              Query.equal("voteStatus", "upvoted"),
              Query.limit(1),
            ]),
            databases.listDocuments(db, voteCollection, [
              Query.equal("typeId", typeId),
              Query.equal("type", type),
              Query.equal("voteStatus", "downvoted"),
              Query.limit(1),
            ]),
          ]);
          return {
            upvotes: JSON.parse(JSON.stringify(upvotes)),
            downvotes: JSON.parse(JSON.stringify(downvotes)),
          };
        } catch (error) {
          console.error(`Error fetching votes for ${type} ${typeId}:`, error);
          return {
            upvotes: { total: 0, documents: [] },
            downvotes: { total: 0, documents: [] },
          };
        }
      },
      [`votes-${type}-${typeId}`],
      {
        revalidate: 600,
        tags: [`question-${typeId}`, `votes-${typeId}`, "votes"],
      }
    )();
  }
);

/**
 * Caches a paginated/filtered list of questions.
 */
export const getCachedQuestionsList = reactCache(
  async (page: number, tag?: string, search?: string) => {
    // Generate a secure, consistent cache key depending on filter parameters
    const key = `questions-list-${page}-${tag || ""}-${search || ""}`;
    return unstable_cache(
      async () => {
        try {
          const queries = [
            Query.orderDesc("$createdAt"),
            Query.offset((page - 1) * 25),
            Query.limit(25),
          ];

          if (tag) queries.push(Query.equal("tags", tag));
          if (search) {
            queries.push(
              Query.or([
                Query.search("title", search),
                Query.search("content", search),
              ])
            );
          }

          const questions = await databases.listDocuments(db, questionCollection, queries);
          return JSON.parse(JSON.stringify(questions));
        } catch (error) {
          console.error("Error fetching questions list in cache:", error);
          return { total: 0, documents: [] };
        }
      },
      [key],
      {
        revalidate: 600,
        tags: ["questions-list", "questions"],
      }
    )();
  }
);

/**
 * Caches a custom limit of the latest questions.
 */
export const getCachedLatestQuestions = reactCache(
  async (limit: number = 5) => {
    return unstable_cache(
      async () => {
        try {
          const questions = await databases.listDocuments(db, questionCollection, [
            Query.limit(limit),
            Query.orderDesc("$createdAt"),
          ]);
          return JSON.parse(JSON.stringify(questions));
        } catch (error) {
          console.error(`Error fetching latest ${limit} questions:`, error);
          return { total: 0, documents: [] };
        }
      },
      [`latest-questions-${limit}`],
      {
        revalidate: 600,
        tags: ["latest-questions", "questions"],
      }
    )();
  }
);
