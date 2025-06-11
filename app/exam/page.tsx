"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  FileText,
  Play,
  TrendingUp,
  Brain,
  Loader2,
  Plus,
  Calendar,
  Trophy,
  Target,
  BookOpen,
  History,
} from "lucide-react";

interface Document {
  id: string;
  filename: string;
  status: string;
}

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

interface Exam {
  id: string;
  title: string;
  documentId: string;
  questions: ExamQuestion[];
  timeLimit: number; // in minutes
  status: "not_started" | "in_progress" | "completed";
  score?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export default function ExamsPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [examSettings, setExamSettings] = useState({
    questionCount: 10,
    timeLimit: 30,
    difficulty: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, examsRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/exams"),
      ]);

      const [docsData, examsData] = await Promise.all([
        docsRes.json(),
        examsRes.json(),
      ]);

      const processedDocs = docsData.filter(
        (doc: Document) => doc.status === "processed"
      );
      setDocuments(processedDocs);
      setExams(
        examsData.sort(
          (a: Exam, b: Exam) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

      if (processedDocs.length > 0 && !selectedDocument) {
        setSelectedDocument(processedDocs[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const createExam = async () => {
    if (!selectedDocument) return;

    setLoading(true);
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument,
          questionCount: examSettings.questionCount,
          timeLimit: examSettings.timeLimit,
          difficulty: examSettings.difficulty,
        }),
      });

      if (response.ok) {
        const newExam = await response.json();
        router.push(`/exam/${newExam.id}`);
      } else {
        console.error("Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (exam: Exam) => {
    switch (exam.status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-600";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPerformanceStats = () => {
    const completedExams = exams.filter((exam) => exam.status === "completed");
    const totalExams = completedExams.length;

    if (totalExams === 0) return null;

    const averageScore =
      completedExams.reduce((sum, exam) => sum + (exam.score || 0), 0) /
      totalExams;
    const highestScore = Math.max(
      ...completedExams.map((exam) => exam.score || 0)
    );
    const recentExams = completedExams.slice(0, 5);

    return {
      totalExams,
      averageScore: Math.round(averageScore),
      highestScore,
      recentExams,
    };
  };

  const stats = getPerformanceStats();

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span>Loading exams...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Exam Center
              </h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("create")}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("history")}
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === "create" ? (
            <>
              {/* Performance Overview */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <Card className="p-4 text-center">
                    <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalExams}
                    </div>
                    <div className="text-sm text-gray-600">Exams Completed</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.averageScore}%
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.highestScore}%
                    </div>
                    <div className="text-sm text-gray-600">Best Score</div>
                  </Card>
                </div>
              )}

              {/* Create New Exam */}
              <Card className="p-6 sm:p-8 mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Create Practice Exam
                    </h2>
                    <p className="text-gray-600">
                      Generate a custom exam from your uploaded documents
                    </p>
                  </div>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Documents Available
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload and process documents first to create exams
                    </p>
                    <Button onClick={() => router.push("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Document Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Document
                      </label>
                      <Select
                        value={selectedDocument}
                        onValueChange={setSelectedDocument}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a document" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{doc.filename}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Exam Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Questions
                        </label>
                        <Select
                          value={examSettings.questionCount.toString()}
                          onValueChange={(value) =>
                            setExamSettings((prev) => ({
                              ...prev,
                              questionCount: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 Questions</SelectItem>
                            <SelectItem value="10">10 Questions</SelectItem>
                            <SelectItem value="15">15 Questions</SelectItem>
                            <SelectItem value="20">20 Questions</SelectItem>
                            <SelectItem value="25">25 Questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit
                        </label>
                        <Select
                          value={examSettings.timeLimit.toString()}
                          onValueChange={(value) =>
                            setExamSettings((prev) => ({
                              ...prev,
                              timeLimit: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty
                        </label>
                        <Select
                          value={examSettings.difficulty}
                          onValueChange={(value) =>
                            setExamSettings((prev) => ({
                              ...prev,
                              difficulty: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Create Button */}
                    <Button
                      onClick={createExam}
                      disabled={!selectedDocument || loading}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Exam...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Create Exam
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            </>
          ) : (
            /* Exam History */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Exam History
                </h2>
                <Badge variant="outline">{exams.length} total exams</Badge>
              </div>

              {exams.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No exams yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first practice exam to get started
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Exam
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {exams.map((exam) => (
                    <Card key={exam.id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {exam.title}
                            </h3>
                            {getStatusBadge(exam)}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span>{exam.questions.length} questions</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{exam.timeLimit} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(exam.createdAt)}</span>
                            </div>
                            {exam.score !== undefined && (
                              <div className="flex items-center space-x-1">
                                <Trophy className="w-4 h-4" />
                                <span
                                  className={`font-medium ${getScoreColor(exam.score)}`}
                                >
                                  {exam.score}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {exam.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/exam/${exam.id}/results`)
                              }
                            >
                              View Results
                            </Button>
                          )}

                          <Button
                            variant={
                              exam.status === "in_progress"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => router.push(`/exam/${exam.id}`)}
                          >
                            {exam.status === "in_progress" ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Continue
                              </>
                            ) : exam.status === "completed" ? (
                              "Review"
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
