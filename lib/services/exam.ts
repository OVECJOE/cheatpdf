import { createQuestionGenerationChain } from "../core/mistral";
import db from "../config/db";
import { ExamStatus, SubscriptionStatus } from "@prisma/client";
import {vectorStore} from "@/lib/core/vector-store";

interface QuestionData {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface ExamWithQuestions {
    id: string;
    title: string;
    timeLimit: number;
    totalQuestions: number;
    status: ExamStatus;
    score?: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    document: {
        id: string;
        name: string;
        fileName?: string;
    };
    questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: string;
        explanation?: string;
        userAnswer?: string;
        isCorrect?: boolean;
    }>;
}

interface ExamResults {
    id: string;
    title: string;
    timeLimit: number;
    totalQuestions: number;
    status: ExamStatus;
    score?: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    document: {
        id: string;
        name: string;
        fileName?: string;
    };
    questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        userAnswer?: string;
        isCorrect: boolean;
    }>;
}

interface ExamList {
    id: string;
    title: string;
    timeLimit: number;
    totalQuestions: number;
    status: ExamStatus;
    score?: number | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    createdAt: Date;
    document: {
        id: string;
        name: string;
        fileName?: string;
    };
    _count: {
        questions: number;
        answers: number;
    };
}

export class ExamService {
    /**
     * Create a new exam from a document
     */
    public async create(
        userId: string,
        documentId: string,
        title: string,
        timeLimit: number,
        difficultyLevel: string,
        numQuestions: number = 10,
    ): Promise<{ id: string; title: string; status: ExamStatus }> {
        try {
            // Verify document ownership and subscription
            const user = await db.user.findUnique({
                where: { id: userId },
                include: { documents: { where: { id: documentId } } },
            });

            if (!user || user.documents.length === 0) {
                throw new Error("Document not found or access denied");
            }

            if (user.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
                throw new Error("Exam mode requires an active subscription");
            }

            const document = user.documents[0];
            if (!document.vectorized) {
                throw new Error("Document must be vectorized before creating an exam");
            }

            // Get relevant context from the vector store
            const relevantDocs = await vectorStore.similaritySearch(
                title,
                userId,
                40,
                documentId,
            );
            const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

            // Generate questions using the Mistral chain
            const questionChain = createQuestionGenerationChain();
            const questionsJson = await questionChain.invoke({
                context,
                numQuestions,
                examTitle: title,
                difficultyLevel,
                timeLimit,
                questionTypes: "multiple-choice",
                userBackground: JSON.stringify({
                    name: user.name,
                    educationLevel: user.educationLevel,
                    studyGoals: user.studyGoals,
                    examType: user.examType,
                    subjects: user.subjects,
                    language: user.language,
                    country: user.country,
                    userType: user.userType
                })
            }) as QuestionData[];

            if (!Array.isArray(questionsJson) || questionsJson.length === 0) {
                throw new Error("No valid questions generated");
            }

            // Create exam record
            const exam = await db.exam.create({
                data: {
                    title,
                    timeLimit,
                    totalQuestions: questionsJson.length,
                    userId,
                    documentId,
                    status: ExamStatus.NOT_STARTED,
                },
            });

            // Create exam questions
            await Promise.all(
                questionsJson.map((q) =>
                    db.examQuestion.create({
                        data: {
                            question: q.question,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            examId: exam.id,
                        },
                    })
                ),
            );

            return {
                id: exam.id,
                title: exam.title,
                status: exam.status,
            };
        } catch (error) {
            console.error("Error creating exam:", error);
            throw error;
        }
    }

    /**
     * Get exam details for overview (without starting)
     */
    public async getExamDetails(examId: string, userId: string): Promise<ExamWithQuestions> {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        select: {
                            id: true,
                            question: true,
                            options: true,
                            correctAnswer: true,
                            explanation: true,
                            answers: {
                                where: { examId },
                                select: {
                                    answer: true,
                                    isCorrect: true,
                                }
                            }
                        }
                    },
                }
            });

            if (!exam) {
                throw new Error("Exam not found or access denied");
            }

            return {
                id: exam.id,
                title: exam.title,
                timeLimit: exam.timeLimit,
                totalQuestions: exam.totalQuestions,
                status: exam.status,
                score: exam.score ?? undefined,
                startedAt: exam.startedAt ?? undefined,
                completedAt: exam.completedAt ?? undefined,
                createdAt: exam.createdAt,
                document: exam.document,
                questions: exam.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    userAnswer: q.answers[0]?.answer || undefined,
                    isCorrect: q.answers[0]?.isCorrect || undefined,
                })),
            };
        } catch (error) {
            console.error("Error fetching exam details:", error);
            throw error;
        }
    }

    /**
     * Get exam for taking (with user answers but without correct answers)
     */
    public async getExamForTaking(examId: string, userId: string): Promise<ExamWithQuestions> {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        include: {
                            answers: {
                                where: { examId },
                                select: {
                                    answer: true,
                                    isCorrect: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!exam) {
                throw new Error("Exam not found or access denied");
            }

            if (exam.status === ExamStatus.NOT_STARTED) {
                throw new Error("Exam has not been started");
            }

            if (exam.status === ExamStatus.COMPLETED) {
                throw new Error("Exam has already been completed");
            }

            return {
                id: exam.id,
                title: exam.title,
                timeLimit: exam.timeLimit,
                totalQuestions: exam.totalQuestions,
                status: exam.status,
                score: exam.score ?? undefined,
                startedAt: exam.startedAt ?? undefined,
                completedAt: exam.completedAt ?? undefined,
                createdAt: exam.createdAt,
                document: exam.document,
                questions: exam.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer, // Keep for internal use
                    userAnswer: q.answers[0]?.answer,
                    isCorrect: q.answers[0]?.isCorrect,
                })),
            };
        } catch (error) {
            console.error("Error fetching exam for taking:", error);
            throw error;
        }
    }

    /**
     * Start an exam
     */
    public async start(examId: string, userId: string): Promise<ExamWithQuestions> {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        select: {
                            id: true,
                            question: true,
                            options: true,
                            correctAnswer: true,
                        }
                    }
                }
            });

            if (!exam) {
                throw new Error("Exam not found or access denied");
            }

            if (exam.status !== ExamStatus.NOT_STARTED) {
                throw new Error("Exam has already been started or completed");
            }

            // Update exam status to IN_PROGRESS
            const updatedExam = await db.exam.update({
                where: { id: examId },
                data: {
                    status: ExamStatus.IN_PROGRESS,
                    startedAt: new Date(),
                },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        select: {
                            id: true,
                            question: true,
                            options: true,
                            correctAnswer: true,
                        }
                    }
                }
            });

            return {
                id: updatedExam.id,
                title: updatedExam.title,
                timeLimit: updatedExam.timeLimit,
                totalQuestions: updatedExam.totalQuestions,
                status: updatedExam.status,
                score: updatedExam.score ?? undefined,
                startedAt: updatedExam.startedAt ?? undefined,
                completedAt: updatedExam.completedAt ?? undefined,
                createdAt: updatedExam.createdAt,
                document: updatedExam.document,
                questions: updatedExam.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                })),
            };
        } catch (error) {
            console.error("Error starting exam:", error);
            throw error;
        }
    }

    /**
     * Submit an answer for a question
     */
    public async submitAnswer(
        examId: string,
        questionId: string,
        answer: string,
        userId: string,
    ): Promise<{ success: boolean; isCorrect: boolean }> {
        try {
            // Verify exam ownership and status
            const exam = await db.exam.findFirst({
                where: { id: examId, userId, status: ExamStatus.IN_PROGRESS },
                include: { questions: { where: { id: questionId } } },
            });

            if (!exam) {
                throw new Error('Exam not found, not in progress, or access denied');
            }

            if (exam.questions.length === 0) {
                throw new Error('Question not found in this exam');
            }

            const question = exam.questions[0];
            const isCorrect = question.correctAnswer === answer;

            // Check if answer already exists
            const existingAnswer = await db.examAnswer.findFirst({
                where: {
                    examId,
                    questionId
                },
            });

            if (existingAnswer) {
                await db.examAnswer.update({
                    where: { id: existingAnswer.id },
                    data: { answer, isCorrect },
                });
            } else {
                // Create new answer record
                await db.examAnswer.create({
                    data: {
                        examId,
                        questionId,
                        answer,
                        isCorrect,
                    },
                });
            }

            return { success: true, isCorrect };
        } catch (error) {
            console.error("Error submitting exam answer:", error);
            throw error;
        }
    }

    /**
     * Complete an exam and calculate results
     */
    public async complete(examId: string, userId: string): Promise<ExamResults> {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId, status: ExamStatus.IN_PROGRESS },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        include: {
                            answers: {
                                where: { examId },
                            }
                        }
                    }
                }
            });

            if (!exam) {
                throw new Error("Exam not found or not in progress");
            }

            // Calculate score
            const correctAnswers = exam.questions.filter(q => 
                q.answers[0] && q.answers[0].isCorrect
            ).length;
            const score = (correctAnswers / exam.totalQuestions) * 100;

            // Update exam
            const completedExam = await db.exam.update({
                where: { id: examId },
                data: {
                    status: ExamStatus.COMPLETED,
                    completedAt: new Date(),
                    score,
                },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        include: {
                            answers: {
                                where: { examId },
                            }
                        }
                    }
                }
            });

            return {
                id: completedExam.id,
                title: completedExam.title,
                timeLimit: completedExam.timeLimit,
                totalQuestions: completedExam.totalQuestions,
                status: completedExam.status,
                score: completedExam.score ?? undefined,
                startedAt: completedExam.startedAt ?? undefined,
                completedAt: completedExam.completedAt ?? undefined,
                createdAt: completedExam.createdAt,
                document: completedExam.document,
                questions: completedExam.questions.map(q => {
                    const userAnswer = q.answers[0];
                    return {
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        userAnswer: userAnswer?.answer,
                        isCorrect: userAnswer?.isCorrect || false,
                    };
                }),
            };
        } catch (error) {
            console.error("Error completing exam:", error);
            throw error;
        }
    }

    /**
     * Get exam results (for completed exams)
     */
    public async getResults(examId: string, userId: string): Promise<ExamResults> {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId },
                include: {
                    document: {
                        select: {
                            id: true,
                            name: true,
                            fileName: true,
                        }
                    },
                    questions: {
                        include: {
                            answers: {
                                where: { examId },
                            }
                        }
                    }
                }
            });

            if (!exam) {
                throw new Error("Exam not found or access denied");
            }

            const questionsWithResults = exam.questions.map(q => {
                const userAnswer = q.answers[0];
                return {
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    userAnswer: userAnswer?.answer,
                    isCorrect: userAnswer?.isCorrect || false,
                };
            });

            return {
                id: exam.id,
                title: exam.title,
                timeLimit: exam.timeLimit,
                totalQuestions: exam.totalQuestions,
                status: exam.status,
                score: exam.score ?? undefined,
                startedAt: exam.startedAt ?? undefined,
                completedAt: exam.completedAt ?? undefined,
                createdAt: exam.createdAt,
                document: exam.document,
                questions: questionsWithResults,
            };
        } catch (error) {
            console.error("Error fetching exam results:", error);
            throw error;
        }
    }

    /**
     * Get all exams for a user
     */
    public async getUserExams(userId: string): Promise<ExamList[]> {
        try {
            return db.exam.findMany({
                where: { userId },
                include: {
                    document: {
                        select: { 
                            id: true, 
                            name: true, 
                            fileName: true 
                        }
                    },
                    _count: {
                        select: {
                            questions: true,
                            answers: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            console.error("Error fetching user exams:", error);
            throw error;
        }
    }

    /**
     * Delete an exam
     */
    public async delete(examId: string, userId: string): Promise<{ success: boolean }> {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId },
            });

            if (!exam) {
                throw new Error("Exam not found or access denied");
            }

            await db.exam.delete({
                where: { id: examId },
            });

            return { success: true };
        } catch (error) {
            console.error("Error deleting exam:", error);
            throw error;
        }
    }

    /**
     * Get exam statistics for a user
     */
    public async getExamStats(userId: string): Promise<{
        total: number;
        completed: number;
        inProgress: number;
        notStarted: number;
        averageScore: number;
        bestScore: number;
    }> {
        try {
            const exams = await db.exam.findMany({
                where: { userId },
                select: {
                    status: true,
                    score: true,
                }
            });

            const total = exams.length;
            const completed = exams.filter(e => e.status === ExamStatus.COMPLETED).length;
            const inProgress = exams.filter(e => e.status === ExamStatus.IN_PROGRESS).length;
            const notStarted = exams.filter(e => e.status === ExamStatus.NOT_STARTED).length;

            const completedExams = exams.filter(e => e.status === ExamStatus.COMPLETED && e.score !== null);
            const averageScore = completedExams.length > 0 
                ? completedExams.reduce((sum, exam) => sum + (exam.score || 0), 0) / completedExams.length 
                : 0;
            const bestScore = completedExams.length > 0 
                ? Math.max(...completedExams.map(e => e.score || 0)) 
                : 0;

            return {
                total,
                completed,
                inProgress,
                notStarted,
                averageScore: Math.round(averageScore),
                bestScore: Math.round(bestScore),
            };
        } catch (error) {
            console.error("Error fetching exam stats:", error);
            throw error;
        }
    }
}

export const examService = new ExamService();
