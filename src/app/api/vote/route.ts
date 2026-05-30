import { db, voteCollection, questionCollection, answerCollection } from "@/models/name";
import { databases, users } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { UserPrefs } from "@/store/Auth";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { votedById, voteStatus, type, typeId } = await request.json();

    // 1. Find if a vote document already exists for this user on this target
    const existingVotes = await databases.listDocuments(db, voteCollection, [
      Query.equal("type", type),
      Query.equal("typeId", typeId),
      Query.equal("votedById", votedById),
    ]);

    // 2. Fetch the target (question or answer) to get the authorId
    const targetCollection = type === "question" ? questionCollection : answerCollection;
    const targetDoc = await databases.getDocument(db, targetCollection, typeId);
    const authorId = targetDoc.authorId;

    let voteDoc = null;
    let repChange = 0; // tracking how much we should change the author's reputation

    if (existingVotes.total > 0) {
      const oldVote = existingVotes.documents[0];
      if (oldVote.voteStatus === voteStatus) {
        // User clicked the same vote button, meaning they want to remove their vote
        await databases.deleteDocument(db, voteCollection, oldVote.$id);
        // Reverse the reputation change
        repChange = oldVote.voteStatus === "upvoted" ? -1 : 1;
      } else {
        // User is changing their vote (e.g. upvote -> downvote or downvote -> upvote)
        voteDoc = await databases.updateDocument(db, voteCollection, oldVote.$id, {
          voteStatus: voteStatus,
        });
        // Upvote -> Downvote: -2 rep; Downvote -> Upvote: +2 rep
        repChange = voteStatus === "upvoted" ? 2 : -2;
      }
    } else {
      // User is voting for the first time
      voteDoc = await databases.createDocument(db, voteCollection, ID.unique(), {
        type,
        typeId,
        voteStatus,
        votedById,
      });
      repChange = voteStatus === "upvoted" ? 1 : -1;
    }

    // 3. Update the author's reputation in users preference store
    if (repChange !== 0) {
      const prefs = await users.getPrefs<UserPrefs>(authorId);
      const currentReputation = Number(prefs.reputation || 0);
      await users.updatePrefs(authorId, {
        reputation: Math.max(0, currentReputation + repChange), // don't let rep go below 0
      });
    }

    // 4. Recalculate upvotes and downvotes to return to the frontend
    const [upvotes, downvotes] = await Promise.all([
      databases.listDocuments(db, voteCollection, [
        Query.equal("type", type),
        Query.equal("typeId", typeId),
        Query.equal("voteStatus", "upvoted"),
        Query.limit(1),
      ]),
      databases.listDocuments(db, voteCollection, [
        Query.equal("type", type),
        Query.equal("typeId", typeId),
        Query.equal("voteStatus", "downvoted"),
        Query.limit(1),
      ]),
    ]);

    // Invalidate cached question details, votes, user reputation, etc.
    const questionId = type === "question" ? typeId : targetDoc.questionId;
    revalidateTag(`question-${questionId}`, { expire: 0 });
    revalidateTag("questions", { expire: 0 });
    revalidateTag(`user-${authorId}`, { expire: 0 });

    return NextResponse.json(
      {
        data: {
          document: voteDoc,
          voteResult: upvotes.total - downvotes.total,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error processing vote" },
      { status: error?.status || error?.code || 500 }
    );
  }
}
