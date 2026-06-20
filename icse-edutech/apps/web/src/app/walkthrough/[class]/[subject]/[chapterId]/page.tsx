"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function WalkthroughPage() {
  const params = useParams<{ class: string; subject: string; chapterId: string }>();
  const router = useRouter();

  // Redirect transparently to the guide page — walkthrough is not yet built
  useEffect(() => {
    router.replace(`/guide/${params.class}/${params.subject}/${params.chapterId}`);
  }, [params.class, params.subject, params.chapterId, router]);

  return null;
}
