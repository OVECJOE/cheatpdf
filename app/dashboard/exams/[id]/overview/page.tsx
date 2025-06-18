"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Clock,
  Target,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Shield,
  Zap,
  Loader2,
  Eye,
  BarChart3,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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
  questions: any[];
}

export default function ExamOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const fetchExam = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/exams/${examId}`);
      const data = await response.json();
      if (response.ok) {
        setExam(data.exam);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!exam) return;

    setStarting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        toast.success("Starting exam...");
        router.push(`/dashboard/exams/${examId}/take`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to start exam");
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error("Failed to start exam");
    } finally {
      setStarting(false);
    }
  };

  const getStatusBadge = (status: Exam["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-border text-muted-foreground">
            Ready to Start
          </Badge>
        );
    }
  };

  const getDifficultyInfo = () => {
    const questionCount = exam?.totalQuestions || 0;
    const timeLimit = exam?.timeLimit || 0;
    const timePerQuestion = Math.round(timeLimit / questionCount);

    let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
    let color = "text-brand-amber bg-amber-100 border-amber-200";

    if (timePerQuestion >= 3) {
      difficulty = "Easy";
      color = "text-green-600 bg-green-100 border-green-200";
    } else if (timePerQuestion <= 1.5) {
      difficulty = "Hard";
      color = "text-red-600 bg-red-100 border-red-200";
    }

    return { difficulty, color, timePerQuestion };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center bg-card border-border">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <div className="space-y-2 mb-4">
            <h2 className="text-xl font-bold text-foreground">Exam Not Found</h2>
            <p className="text-muted-foreground">
              The exam you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/exams")}
            className="gradient-brand hover:opacity-90 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  const { difficulty, color, timePerQuestion } = getDifficultyInfo();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/exams")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exams
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              {getStatusBadge(exam.status)}
              <p className="text-muted-foreground">
                Created {formatDistanceToNow(new Date(exam.createdAt))} ago
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            className="gradient-brand hover:opacity-90 transition-all duration-300"
          >
            Overview
          </Button>
          {exam.status !== "NOT_STARTED" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/exams/${examId}/take`)}
                className="text-muted-foreground hover:text-foreground"
              >
                Take Exam
              </Button>
              {exam.status === "COMPLETED" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/exams/${examId}/results`)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Results
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/exams/${examId}/analytics`)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Analytics
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Info Card */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Exam Information</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Source Document</p>
                        <p className="text-sm text-muted-foreground">{exam.document.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Questions</p>
                        <p className="text-sm text-muted-foreground">{exam.totalQuestions} multiple choice</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Time Limit</p>
                        <p className="text-sm text-muted-foreground">{exam.timeLimit} minutes total</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Difficulty</p>
                        <Badge className={color}>{difficulty}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Pace</p>
                        <p className="text-sm text-muted-foreground">~{timePerQuestion} min per question</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Security</p>
                        <p className="text-sm text-muted-foreground">Proctoring enabled</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {exam.status === "COMPLETED" && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Final Score</p>
                      <p className="text-2xl font-bold text-primary">{exam.score}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-sm font-medium text-foreground">
                        {exam.completedAt && formatDistanceToNow(new Date(exam.completedAt))} ago
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preparation Tips */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Preparation Tips</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Review the document</p>
                      <p className="text-sm text-muted-foreground">Make sure you're familiar with the content</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Find a quiet space</p>
                      <p className="text-sm text-muted-foreground">Minimize distractions for better focus</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Check your internet</p>
                      <p className="text-sm text-muted-foreground">Ensure stable connection throughout</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Read carefully</p>
                      <p className="text-sm text-muted-foreground">Take time to understand each question</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">5</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Manage your time</p>
                      <p className="text-sm text-muted-foreground">Keep track of remaining time</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">6</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Stay focused</p>
                      <p className="text-sm text-muted-foreground">Avoid switching tabs or windows</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="p-6 bg-card border-border sticky top-6">
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

                {exam.status === "COMPLETED" && (
                  <>
                    <Button
                      onClick={() => router.push(`/dashboard/exams/${examId}/results`)}
                      className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Results
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/exams/${examId}/analytics`)}
                      className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </>
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
      </div>
    </div>
  );
} 