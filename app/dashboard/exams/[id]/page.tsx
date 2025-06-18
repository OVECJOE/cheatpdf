"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  useEffect(() => {
    if (examId) {
      router.replace(`/dashboard/exams/${examId}/overview`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );
} 