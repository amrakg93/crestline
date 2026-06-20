"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Zap } from "lucide-react";
import { getSubjectDisplayName } from "@/lib/subjects";

export default function WalkthroughPage() {
  const params = useParams<{ class: string; subject: string; chapterId: string }>();
  const router = useRouter();
  const classId = params.class;
  const subject = params.subject;
  const chapterId = params.chapterId;

  const displaySubject = getSubjectDisplayName(subject);
  const chapterName = chapterId.replace(/_/g, " ");

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="hover:text-foreground flex items-center gap-1 min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ChevronRight className="w-3 h-3" />
        <span>Class {classId}</span>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => router.push(`/subjects/${classId}/${subject}`)}
          className="hover:text-foreground"
        >
          {displaySubject}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{chapterName}</span>
      </div>

      <div className="card text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-7 h-7 text-accent" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">Smart Walkthroughs</h1>
        <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
          Prerequisite-aware learning paths are coming soon. Use the{" "}
          <button
            onClick={() => router.push(`/guide/${classId}/${subject}/${chapterId}`)}
            className="text-accent underline underline-offset-2"
          >
            Guide
          </button>{" "}
          in the meantime.
        </p>
        <span className="inline-block mt-5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-semibold border border-warning/20">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
