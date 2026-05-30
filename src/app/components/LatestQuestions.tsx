import QuestionCard from "@/components/QuestionCard";
import {
  getCachedLatestQuestions,
  getCachedUser,
  getCachedAnswers,
  getCachedVotes,
} from "@/utils/cache";
import React from "react";

const LatestQuestions = async () => {
  const questions = await getCachedLatestQuestions(5);
  console.log("Fetched Questions:", questions);

  questions.documents = await Promise.all(
    questions.documents.map(async (ques: any) => {
      const [author, answers, votes] = await Promise.all([
        getCachedUser(ques.authorId),
        getCachedAnswers(ques.$id),
        getCachedVotes("question", ques.$id),
      ]);

      return {
        ...ques,
        totalAnswers: answers.total,
        totalVotes: votes.upvotes.total + votes.downvotes.total,
        author: {
          $id: author.$id,
          reputation: author.prefs?.reputation || 0,
          name: author.name,
        },
      };
    }),
  );

  console.log("Latest question");
  console.log(questions);
  return (
    <div className="space-y-6">
      {questions.documents.map((question: any) => (
        <QuestionCard key={question.$id} ques={question} />
      ))}
    </div>
  );
};

export default LatestQuestions;
