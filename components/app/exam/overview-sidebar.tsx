import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Clock, Play, Loader2 } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Exam {
  id: string;
  title: string;
  document: { id: string; name: string; fileName: string };
  timeLimit: number;
  totalQuestions: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface ExamSidebarProps {
  exam: Exam;
  examId: string;
  handleStartExam: () => void;
  starting: boolean;
  router: AppRouterInstance;
}

export default function ExamSidebar({
  exam,
  examId,
  handleStartExam,
  starting,
  router
}: ExamSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Action Card */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {exam.status === "COMPLETED" ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : exam.status === "IN_PROGRESS" ? (
                <Clock className="w-8 h-8 text-blue-600" />
              ) : (
                <Play className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="space-y-1 mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {exam.status === "COMPLETED"
                  ? "Exam Completed"
                  : exam.status === "IN_PROGRESS"
                    ? "Continue Exam"
                    : "Ready to Start"
                }
              </h3>
              <p className="text-muted-foreground">
                {exam.status === "COMPLETED"
                  ? "Review your results and performance"
                  : exam.status === "IN_PROGRESS"
                    ? "Resume where you left off"
                    : "Take the exam when you're ready"
                }
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {exam.status === "NOT_STARTED" && (
              <Button
                onClick={handleStartExam}
                disabled={starting}
                className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Exam
                  </>
                )}
              </Button>
            )}
            {exam.status === "IN_PROGRESS" && (
              <Button
                onClick={() => router.push(`/dashboard/exams/${examId}/take`)}
                className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
              >
                <Play className="w-4 h-4 mr-2" />
                Continue Exam
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/documents/${exam.document.id}`)}
              className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Document
            </Button>
          </div>
        </div>
      </Card>
      {/* Quick Stats */}
      <Card className="p-4 bg-card border-border">
        <h4 className="font-semibold text-foreground mb-3">Quick Stats</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pass Rate</span>
            <span className="text-sm font-medium text-foreground">70%+</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg Completion</span>
            <span className="text-sm font-medium text-foreground">{exam.timeLimit - 5} min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Question Type</span>
            <span className="text-sm font-medium text-foreground">Multiple Choice</span>
          </div>
        </div>
      </Card>
    </div>
  );
} 