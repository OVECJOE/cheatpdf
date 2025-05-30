import { createQuestionGenerationChain } from "../core/mistral";
import db from "../config/db";
import { ExamStatus } from "@prisma/client";

interface QuestionData {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export class ExamService {
    public async create(
        userId: string,
        documentId: string,
        title: string,
        timeLimit: number,
        numQuestions: number = 10,
    ) {
        // Verify document ownership and subscription
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { documents: { where: { id: documentId } } },
        });

        if (!user || user.documents.length === 0) {
            throw new Error("Document not found or access denied");
        }

        if (user.subscriptionStatus !== "ACTIVE") {
            throw new Error("Exam mode requires an active subscription");
        }

        const document = user.documents[0];
        if (!document.vectorized) {
            throw new Error(
                "Document must be vectorized before creating an exam",
            );
        }

        // Generate questions using the Mistral chain
        const questionChain = createQuestionGenerationChain();
        const questionsJson = await questionChain.invoke({
            content: document.content,
            numQuestions,
        });

        let questions: QuestionData[];
        try {
            questions = JSON.parse(questionsJson) as QuestionData[];
        } catch (error) {
            console.error("Error parsing questions JSON:", error);
            throw new Error("Failed to generate valid exam questions");
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("No valid questions generated");
        }

        // Create exam record
        const exam = await db.exam.create({
            data: {
                title,
                timeLimit,
                totalQuestions: questions.length,
                userId,
                documentId,
                status: ExamStatus.NOT_STARTED,
            },
        });

        // create exam questions
        await Promise.all(
            questions.map((q) =>
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

        return exam;
    }

    public async start(examId: string, userId: string) {
        try {
            const exam = await db.exam.findUnique({
                where: { id: examId, userId },
                include: { questions: true },
            })

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
                    questions: {
                        select: {
                            id: true,
                            question: true,
                            options: true,
                        }
                    }
                }
            })

            return updatedExam;
        } catch (error) {
            console.error("Error starting exam:", error);
            throw new Error("Failed to start exam");
        }
    }

    public async submit(
        examId: string,
        questionId: string,
        answer: string,
        userId: string,
    ) {
        try {
            // Verify exam ownership and status
            const exam = await db.exam.findFirst({
                where: { id: examId, userId, status: ExamStatus.IN_PROGRESS },
                include: { questions: { where: { id: questionId } } },
            })

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
                return db.examAnswer.update({
                    where: { id: existingAnswer.id },
                    data: { answer, isCorrect },
                });
            }

            // Create new answer record
            return db.examAnswer.create({
                data: {
                    examId,
                    questionId,
                    answer,
                    isCorrect,
                },
            });
        } catch (error) {
            console.error("Error submitting exam answer:", error);
            throw new Error("Failed to submit exam answer");
        }
    }

    public async complete(examId: string, userId: string) {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId, status: ExamStatus.IN_PROGRESS },
                include: {
                    questions: true,
                    answers: true,
                }
            })

            if (!exam) {
                throw new Error("Exam not found or not in progress");
            }

            // Calculate score
            const correctAnswers = exam.answers.filter(a => a.isCorrect).length;
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
                    questions: {
                        include: {
                            answers: {
                                where: { examId },
                            }
                        }
                    }
                }
            })
            
            return completedExam;
        } catch (error) {
            console.error("Error completing exam:", error);
            throw new Error("Failed to complete exam");
        }
    }

    public async getResults(examId: string, userId: string) {
        try {
            const exam = await db.exam.findFirst({
                where: { id: examId, userId, status: ExamStatus.COMPLETED },
                include: {
                    questions: {
                        include: {
                            answers: {
                                where: { examId },
                            }
                        }
                    }
                }
            })

            if (!exam) {
                throw new Error("Exam not found or not completed");
            }

            const questionsWithResults = exam.questions.map(q => {
                const userAnswer = q.answers[0];
                const showExaplanation = userAnswer && !userAnswer.isCorrect;

                return {
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    userAnswer: userAnswer?.answer,
                    correctAnswer: q.correctAnswer,
                    isCorrect: userAnswer?.isCorrect || false,
                    explanation: showExaplanation ? q.explanation : null,
                }
            })

            return {
                ...exam,
                questions: questionsWithResults,
            }
        } catch (error) {
            console.error("Error fetching exam results:", error);
            throw new Error("Failed to fetch exam results");
        }
    }

    async getUserExams(userId: string) {
        try {
            return db.exam.findMany({
                where: { userId },
                include: {
                    document: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
            })
        } catch (error) {
            console.error("Error fetching user exams:", error);
            throw new Error("Failed to fetch user exams");
        }
    }
}

export const examService = new ExamService();
