import React from "react";
import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import QuestionCard from "@/components/QuestionCard";
import Pagination from "@/components/Pagination";
import Search from "./Search";
import {
  getCachedQuestionsList,
  getCachedUser,
  getCachedAnswers,
  getCachedVotes,
} from "@/utils/cache";

const Page = async ({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; tag?: string; search?: string }>;
}) => {
  const searchParams = await searchParamsPromise;
  const pageNumber = searchParams.page || "1";

  const questions = await getCachedQuestionsList(
    +pageNumber,
    searchParams.tag,
    searchParams.search,
  );
  console.log("Questions", questions);

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

  return (
    <div className="container mx-auto px-4 pb-20 pt-36">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Questions</h1>
        <Link href="/questions/ask">
          <ShimmerButton className="shadow-2xl">
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              Ask a question
            </span>
          </ShimmerButton>
        </Link>
      </div>
      <div className="mb-4">
        <Search />
      </div>
      <div className="mb-4">
        <p>{questions.total} questions</p>
      </div>
      <div className="mb-4 max-w-3xl space-y-6">
        {questions.documents.map((ques: any) => (
          <QuestionCard key={ques.$id} ques={ques} />
        ))}
      </div>
      <Pagination total={questions.total} limit={25} />
    </div>
  );
};

export default Page;
