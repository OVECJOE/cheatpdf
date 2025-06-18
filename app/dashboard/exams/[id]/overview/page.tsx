"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Loader2,
  BarChart3,
  ArrowRight,
  Play,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import clsx from "clsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ExamSidebar from "@/components/app/exam/overview-sidebar";
import ExamInfoCard from "@/components/app/exam/overview-info-card";
import ExamPrepTipsCard from "@/components/app/exam/overview-prep-tips";
import Link from "next/link";

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start justify-between w-full space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              {getStatusBadge(exam.status)}
              <p className="text-muted-foreground">
                Created {formatDistanceToNow(new Date(exam.createdAt))} ago
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/exams")}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to Exams
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-5">
        {/* Tabs Navigation */}
        {exam.status === "COMPLETED" && (
          <TabsList className="mt-2 md:mt-0 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        )}
        {exam.status !== "COMPLETED" && (
          <TabsList className="w-full mt-2 md:mt-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="take">Take Exam</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exam Info Card */}
              <ExamInfoCard exam={exam} difficulty={difficulty} color={color} timePerQuestion={timePerQuestion} />
              {/* Preparation Tips */}
              <ExamPrepTipsCard />
            </div>
            {/* Sidebar */}
            <ExamSidebar exam={exam} examId={examId} handleStartExam={handleStartExam} starting={starting} router={router} />
          </div>
        </TabsContent>
        <TabsContent value="results">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Results</h3>
                  <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2 md:justify-between border border-primary/50 rounded-sm p-2 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Final Score:</span>
                      <span className="text-2xl font-bold text-primary">{exam.score}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Correct:</span>
                      <span className="text-lg font-bold text-green-600">{exam.questions.filter(q => q.userAnswer === q.correctAnswer).length}</span>
                      <span className="text-muted-foreground">/ {exam.totalQuestions}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">No.</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Question</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Your Answer</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Correct</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Result</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Explanation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.questions.map((q, idx) => {
                          const isCorrect = q.correctAnswer === q.userAnswer;

                          return (
                            <tr key={q.id} className="odd:bg-muted/30 even:bg-background">
                              <td className="px-2 py-2 align-top text-xs">{idx + 1}</td>
                              <td className="px-2 py-2 align-top">
                                <Tooltip>
                                  <TooltipTrigger>
                                    <p className="text-xs truncate max-w-xs">{q.question}</p>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" sideOffset={5} className="max-w-xs">
                                    <p className="text-base font-medium">{q.question}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="px-2 py-2 align-top">
                                <Badge
                                  variant='outline'
                                  className="text-xs font-semibold"
                                >
                                  {q.userAnswer || 'N/A'}
                                </Badge>
                              </td>
                              <td className="px-2 py-2 align-top">
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {q.correctAnswer}
                                </Badge>
                              </td>
                              <td className="px-2 py-2 align-top">
                                <Badge
                                  variant="outline"
                                  className={clsx("font-semibold text-xs", {
                                    "text-green-600 bg-green-100 border-green-200": isCorrect,
                                    "text-red-600 bg-red-100 border-red-200": !isCorrect
                                  })}
                                >
                                  {isCorrect ? 'correct' : 'incorrect'}
                                </Badge>
                              </td>
                              <td className="px-2 py-2 align-top">
                                <Tooltip>
                                  <TooltipTrigger>
                                    <p className="text-xs font-medium truncate max-w-xs">{q.explanation}</p>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" sideOffset={5} className="max-w-xs">
                                    <p className="text-base font-medium">{q.explanation}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
            <ExamSidebar exam={exam} examId={examId} handleStartExam={handleStartExam} starting={starting} router={router} />
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Analytics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Questions Answered</span>
                    <span className="text-2xl font-bold text-primary">{exam.questions.filter(q => q.userAnswer).length} / {exam.totalQuestions}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                    <Target className="w-8 h-8 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Correct Answers</span>
                    <span className="text-2xl font-bold text-green-600">{exam.questions.filter(q => q.userAnswer === q.correctAnswer).length}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                    <Clock className="w-8 h-8 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Time Limit</span>
                    <span className="text-2xl font-bold text-primary">{exam.timeLimit} min</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Score</span>
                    <span className="text-2xl font-bold text-primary">{exam.score}%</span>
                  </div>
                </div>
              </Card>
            </div>
            <ExamSidebar exam={exam} examId={examId} handleStartExam={handleStartExam} starting={starting} router={router} />
          </div>
        </TabsContent>
        <TabsContent value="take">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Take Exam</h3>
                  <p className="text-muted-foreground">
                    You can take the exam now.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleStartExam} className="gradient-brand hover:opacity-90 transition-all duration-300">
                    <Play className="w-4 h-4" />
                    Take Exam
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 