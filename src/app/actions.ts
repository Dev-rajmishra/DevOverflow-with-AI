"use server";

import { revalidateTag } from "next/cache";

/**
 * Server Action to trigger cache revalidation for questions.
 * Can be called safely from Client Components.
 */
export async function revalidateQuestionCache(questionId?: string) {
  try {
    if (questionId) {
      revalidateTag(`question-${questionId}`, { expire: 0 });
    }
    // Invalidate the questions list and latest questions caches
    revalidateTag("questions", { expire: 0 });
  } catch (error) {
    console.error("Failed to revalidate questions cache:", error);
  }
}
