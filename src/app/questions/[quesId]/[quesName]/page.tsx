import Answers from "@/components/Answer";
import AICodeCompanion from "@/components/AICodeCompanion";
import Comments from "@/components/Comments";
import { MarkdownPreview } from "@/components/RTE";
import VoteButtons from "@/components/VoteButtons";
import { Particles } from "@/components/ui/particles";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { avatars } from "@/models/client/config";
import { questionAttachmentBucket } from "@/models/name";
import { storage } from "@/models/client/config";
import convertDateToRelativeTime from "@/utils/relativeTime";
import slugify from "@/utils/slugify";
import Link from "next/link";
import React from "react";
import DeleteQuestion from "./DeleteQuestion";
import EditQuestion from "./EditQuestion";
import { TracingBeam } from "@/components/ui/tracing-beam";
import {
  getCachedQuestion,
  getCachedAnswers,
  getCachedVotes,
  getCachedComments,
  getCachedUser,
} from "@/utils/cache";

const Page = async ({
  params: paramsPromise,
}: {
  params: Promise<{ quesId: string; quesName: string }>;
}) => {
  const params = await paramsPromise;
  const [question, answers, votes, comments] = await Promise.all([
    getCachedQuestion(params.quesId),
    getCachedAnswers(params.quesId),
    getCachedVotes("question", params.quesId),
    getCachedComments("question", params.quesId),
  ]);

  const { upvotes, downvotes } = votes;

  // since it is dependent on the question, we fetch it here outside of the Promise.all
  const author = await getCachedUser(question.authorId);
  [comments.documents, answers.documents] = await Promise.all([
    Promise.all(
      comments.documents.map(async (comment: any) => {
        const commentAuthor = await getCachedUser(comment.authorId);
        return {
          ...comment,
          author: {
            $id: commentAuthor.$id,
            name: commentAuthor.name,
            reputation: commentAuthor.prefs?.reputation || 0,
          },
        };
      }),
    ),
    Promise.all(
      answers.documents.map(async (answer: any) => {
        const [answerAuthor, answerComments, answerVotes] = await Promise.all([
          getCachedUser(answer.authorId),
          getCachedComments("answer", answer.$id),
          getCachedVotes("answer", answer.$id),
        ]);

        const answerCommentsWithAuthors = await Promise.all(
          answerComments.documents.map(async (comment: any) => {
            const commentAuthor = await getCachedUser(comment.authorId);
            return {
              ...comment,
              author: {
                $id: commentAuthor.$id,
                name: commentAuthor.name,
                reputation: commentAuthor.prefs?.reputation || 0,
              },
            };
          }),
        );

        return {
          ...answer,
          comments: {
            ...answerComments,
            documents: answerCommentsWithAuthors,
          },
          upvotesDocuments: answerVotes.upvotes,
          downvotesDocuments: answerVotes.downvotes,
          author: {
            $id: answerAuthor.$id,
            name: answerAuthor.name,
            reputation: answerAuthor.prefs?.reputation || 0,
          },
        };
      }),
    ),
  ]);

  // Next.js 16 serialization safety: convert Appwrite SDK null prototype / class models to plain JSON-safe objects
  const serializedQuestion = JSON.parse(JSON.stringify(question));
  const serializedAnswers = JSON.parse(JSON.stringify(answers));
  const serializedComments = JSON.parse(JSON.stringify(comments));
  const serializedUpvotes = JSON.parse(JSON.stringify(upvotes));
  const serializedDownvotes = JSON.parse(JSON.stringify(downvotes));
  const serializedAuthor = JSON.parse(JSON.stringify(author));

  return (
    <TracingBeam className="container pl-6">
      <Particles
        className="fixed inset-0 h-full w-full"
        quantity={500}
        ease={100}
        color="#ffffff"
        refresh
      />
      <div className="relative mx-auto px-4 pb-20 pt-36">
        <div className="flex">
          <div className="w-full">
            <h1 className="mb-1 text-3xl font-bold">{serializedQuestion.title}</h1>
            <div className="flex gap-4 text-sm">
              <span>
                Asked {convertDateToRelativeTime(new Date(serializedQuestion.$createdAt))}
              </span>
              <span>Answer {serializedAnswers.total}</span>
              <span>Votes {serializedUpvotes.total + serializedDownvotes.total}</span>
            </div>
          </div>
          <Link href="/questions/ask" className="ml-auto inline-block shrink-0">
            <ShimmerButton className="shadow-2xl">
              <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                Ask a question
              </span>
            </ShimmerButton>
          </Link>
        </div>
        <hr className="my-4 border-white/40" />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: Vote Column */}
          <div className="flex shrink-0 flex-row lg:flex-col items-center gap-4 w-full lg:w-14 justify-center lg:justify-start">
            <VoteButtons
              type="question"
              id={serializedQuestion.$id}
              upvotes={serializedUpvotes}
              downvotes={serializedDownvotes}
            />
            <div className="h-px w-4 lg:w-full lg:h-px bg-white/10" />
            <EditQuestion
              questionId={serializedQuestion.$id}
              questionTitle={serializedQuestion.title}
              authorId={serializedQuestion.authorId}
            />
            <DeleteQuestion
              questionId={serializedQuestion.$id}
              authorId={serializedQuestion.authorId}
            />
          </div>

          {/* MIDDLE: Question Details Markdown & Conversations */}
          <div className="flex-1 w-full overflow-hidden">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-md">
              <MarkdownPreview
                className="rounded-xl p-2 bg-transparent"
                source={serializedQuestion.content}
              />
              {serializedQuestion.attachmentId && (
                <picture className="block mt-4">
                  <img
                    src={
                      serializedQuestion.attachmentId.startsWith("c:")
                        ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlpkssnph"}/image/upload/${serializedQuestion.attachmentId.slice(2)}`
                        : serializedQuestion.attachmentId.startsWith("http")
                          ? serializedQuestion.attachmentId
                          : storage.getFilePreview(
                              questionAttachmentBucket,
                              serializedQuestion.attachmentId,
                            )
                    }
                    alt={serializedQuestion.title}
                    className="rounded-lg border border-white/10 max-h-[400px] w-auto object-cover"
                  />
                </picture>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-mono">
                {serializedQuestion.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/questions?tag=${tag}`}
                    className="inline-block rounded-full bg-white/5 border border-white/10 px-3 py-1 duration-200 hover:bg-white/10 hover:text-indigo-400"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                <picture>
                  <img
                    src={avatars.getInitials(serializedAuthor.name, 32, 32)}
                    alt={serializedAuthor.name}
                    className="rounded-full border border-indigo-500/20"
                  />
                </picture>
                <div className="block leading-tight text-xs">
                  <Link
                    href={`/users/${serializedAuthor.$id}/${slugify(serializedAuthor.name)}`}
                    className="font-bold text-orange-500 hover:text-orange-600 block"
                  >
                    {serializedAuthor.name}
                  </Link>
                  <span className="text-[10px] text-gray-500 font-mono font-bold">
                    Rep: {serializedAuthor.prefs.reputation}
                  </span>
                </div>
              </div>
            </div>

            {/* Comments block */}
            <Comments
              comments={serializedComments}
              className="mt-6"
              type="question"
              typeId={serializedQuestion.$id}
            />
            <hr className="my-6 border-white/10" />
          </div>

          {/* RIGHT: AI Code Companion sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <AICodeCompanion 
              questionTitle={serializedQuestion.title} 
              questionContent={serializedQuestion.content} 
            />
          </div>

        </div>
        <Answers answers={serializedAnswers} questionId={serializedQuestion.$id} />
      </div>
    </TracingBeam>
  );
};

export default Page;
