/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Clock, CheckCircle, X, Crown, FileText,
  Play, RotateCcw, TrendingUp, Brain, AlertCircle
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
}

export default function ExamPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [examSettings, setExamSettings] = useState({
    questionCount: 10,
    timeLimit: 30,
    difficulty: "medium"
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  // Timer effect
  useEffect(() => {
    if (activeExam?.status === "in_progress" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeExam, timeRemaining]);

  const fetchData = async () => {
    try {
      const [docsRes, examsRes, profileRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/exams"),
        fetch("/api/user/profile")
      ]);

      const [docsData, examsData, profileData] = await Promise.all([
        docsRes.json(),
        examsRes.json(),
        profileRes.json()
      ]);

      const processedDocs = docsData.filter((doc: Document) => doc.status === "processed");
      setDocuments(processedDocs);
      setExams(examsData);
      setUserProfile(profileData);

      if (processedDocs.length > 0 && !selectedDocument) {
        setSelectedDocument(processedDocs[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
          difficulty: examSettings.difficulty
        }),
      });

      if (response.ok) {
        const newExam = await response.json();
        setExams(prev => [newExam, ...prev]);
        setActiveExam(newExam);
      } else {
        console.error("Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = (exam: Exam) => {
    setActiveExam({
      ...exam,
      status: "in_progress",
      startedAt: new Date().toISOString()
    });
    setTimeRemaining(exam.timeLimit * 60);
    setShowResults(false);
  };

  const answerQuestion = (questionIndex: number, answerIndex: number) => {
    if (!activeExam || activeExam.status !== "in_progress") return;

    const updatedQuestions = [...activeExam.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      userAnswer: answerIndex
    };

    setActiveExam({
      ...activeExam,
      questions: updatedQuestions
    });
  };

  const submitExam = async () => {
    if (!activeExam) return;

    const completedExam = {
      ...activeExam,
      status: "completed" as const,
      completedAt: new Date().toISOString()
    };

    // Calculate score
    const correctAnswers = completedExam.questions.filter(
      q => q.userAnswer === q.correctAnswer
    ).length;
    const score = Math.round((correctAnswers / completedExam.questions.length) * 100);
    completedExam.score = score;

    setActiveExam(completedExam);
    setShowResults(true);

    try {
      await fetch("/api/exams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: activeExam.id,
          answers: activeExam.questions.map(q => q.userAnswer),
          score,
          completedAt: completedExam.completedAt
        }),
      });

      // Update exams list
      setExams(prev => prev.map(exam => 
        exam.id === activeExam.id ? completedExam : exam
      ));
    } catch (error) {
      console.error("Error submitting exam:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const isPro = userProfile?.subscription?.status === "active";

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium Feature</h2>
            <p className="text-gray-600 mb-6">
              Exam Mode is available with CheatPDF Pro. Generate practice exams, get detailed explanations, and track your progress.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => router.push("/upgrade")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - $5/month
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Continue with Free Features
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && activeExam) {
    const correctAnswers = activeExam.questions.filter(q => q.userAnswer === q.correctAnswer).length;
    const score = activeExam.score || 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setActiveExam(null);
                setShowResults(false);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <Card className="p-8 mb-8">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  score >= 80 ? "bg-green-100" : score >= 60 ? "bg-yellow-100" : "bg-red-100"
                }`}>
                  <span className={`text-3xl font-bold ${
                    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {score}%
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {score >= 80 ? "Excellent!" : score >= 60 ? "Good Job!" : "Keep Studying!"}
                </h1>
                
                <p className="text-gray-600 mb-6">
                  You got {correctAnswers} out of {activeExam.questions.length} questions correct
                </p>

                <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Time: {formatTime((activeExam.timeLimit * 60) - timeRemaining)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Score: {score}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Question Review */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
              
              {activeExam.questions.map((question, index) => {
                const isCorrect = question.userAnswer === question.correctAnswer;
                return (
                  <Card key={question.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          {index + 1}. {question.question}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-3 rounded-lg border ${
                                optionIndex === question.correctAnswer
                                  ? "bg-green-50 border-green-200"
                                  : optionIndex === question.userAnswer && !isCorrect
                                  ? "bg-red-50 border-red-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span>{option}</span>
                                
                                {optionIndex === question.correctAnswer && (
                                  <Badge className="bg-green-600">Correct</Badge>
                                )}
                                
                                {optionIndex === question.userAnswer && !isCorrect && (
                                  <Badge variant="destructive">Your Answer</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {!isCorrect && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-900 mb-1">Explanation</h4>
                                <p className="text-blue-800 text-sm">{question.explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button 
                onClick={() => {
                  setActiveExam(null);
                  setShowResults(false);
                }}
                variant="outline"
              >
                Back to Exams
              </Button>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Take Another Exam
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeExam && activeExam.status === "in_progress") {
    const currentQuestionIndex = activeExam.questions.findIndex(q => q.userAnswer === undefined);
    const currentQuestion = activeExam.questions[currentQuestionIndex] || activeExam.questions[0];
    const answeredCount = activeExam.questions.filter(q => q.userAnswer !== undefined).length;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Timer Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">{activeExam.title}</h1>
                <Badge variant="outline">
                  Question {Math.min(currentQuestionIndex + 1, activeExam.questions.length)} of {activeExam.questions.length}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                  timeRemaining < 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(timeRemaining)}</span>
                </div>
                
                <Button 
                  onClick={submitExam}
                  variant={answeredCount === activeExam.questions.length ? "default" : "outline"}
                >
                  Submit Exam
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {currentQuestion && (
              <Card className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {currentQuestion.question}
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => answerQuestion(currentQuestionIndex, index)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                          currentQuestion.userAnswer === index
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            currentQuestion.userAnswer === index
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300"
                          }`}>
                            {currentQuestion.userAnswer === index && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="font-medium">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // const prevIndex = Math.max(0, currentQuestionIndex - 1);
                        // You could implement question navigation here
                      }}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    
                    <div className="text-sm text-gray-600">
                      {answeredCount} of {activeExam.questions.length} answered
                    </div>
                    
                    <Button
                      onClick={() => {
                        const nextIndex = currentQuestionIndex + 1;
                        if (nextIndex >= activeExam.questions.length) {
                          submitExam();
                        }
                        // You could implement question navigation here
                      }}
                    >
                      {currentQuestionIndex === activeExam.questions.length - 1 ? "Finish" : "Next"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / activeExam.questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Exam Mode</h1>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                <Crown className="w-3 h-3 mr-1" />
                Pro Feature
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Create New Exam */}
            <div className="lg:col-span-2">
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Create Practice Exam
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Select Document
                    </label>
                    <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Questions
                      </label>
                      <Select 
                        value={examSettings.questionCount.toString()} 
                        onValueChange={(value) => setExamSettings(prev => ({ ...prev, questionCount: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 questions</SelectItem>
                          <SelectItem value="10">10 questions</SelectItem>
                          <SelectItem value="15">15 questions</SelectItem>
                          <SelectItem value="20">20 questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Time Limit
                      </label>
                      <Select 
                        value={examSettings.timeLimit.toString()} 
                        onValueChange={(value) => setExamSettings(prev => ({ ...prev, timeLimit: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Difficulty
                      </label>
                      <Select 
                        value={examSettings.difficulty} 
                        onValueChange={(value) => setExamSettings(prev => ({ ...prev, difficulty: value }))}
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

                  <Button 
                    onClick={createExam} 
                    disabled={!selectedDocument || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Exam...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Practice Exam
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Recent Exams */}
              {exams.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Your Practice Exams
                  </h2>
                  
                  <div className="space-y-4">
                    {exams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{exam.title}</h3>
                            <p className="text-sm text-gray-600">
                              {exam.questions.length} questions • {exam.timeLimit} minutes
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {exam.score !== undefined && (
                            <Badge variant={exam.score >= 80 ? "default" : "secondary"}>
                              {exam.score}%
                            </Badge>
                          )}
                          
                          <Button
                            onClick={() => {
                              if (exam.status === "completed") {
                                setActiveExam(exam);
                                setShowResults(true);
                              } else {
                                startExam(exam);
                              }
                            }}
                            size="sm"
                          >
                            {exam.status === "completed" ? "View Results" : "Start Exam"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Tips</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <Brain className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>Read each question carefully before selecting an answer</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>Manage your time wisely - don&apos;t spend too long on one question</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>Review your answers before submitting</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>Wrong answers will show detailed explanations after completion</p>
                  </div>
                </div>
              </Card>

              {exams.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {exams.filter(e => e.score !== undefined).length}
                      </div>
                      <div className="text-sm text-gray-600">Exams Completed</div>
                    </div>
                    
                    {exams.filter(e => e.score !== undefined).length > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(
                            exams
                              .filter(e => e.score !== undefined)
                              .reduce((acc, e) => acc + e.score!, 0) / 
                            exams.filter(e => e.score !== undefined).length
                          )}%
                        </div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}