import { ChatMistralAI } from '@langchain/mistralai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'

export const chatModel = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: 'mistral-large-latest',
  temperature: 0.1,
})

export const questionGenerationModel = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: 'mistral-large-latest',
  temperature: 0.3,
})

// RAG Chain for Chat
export const createChatChain = (userLanguage: string = 'en', country?: string) => {
  const chatPrompt = PromptTemplate.fromTemplate(`
You are CheatPDF, an intelligent assistant that helps users understand and learn from their PDF documents.

Context from the document:
{context}

User Information:
- Language: ${userLanguage}
- Country: ${country || 'Not specified'}

Chat History:
{chatHistory}

User Question: {question}

Instructions:
- Respond in ${userLanguage === 'en' ? 'English' : userLanguage}
- Be helpful, accurate, and educational
- Use the document context to provide detailed answers
- If the question is not related to the document, politely redirect to document-related topics
- Adapt your response style to be appropriate for the user's country and culture
- Provide examples and explanations that help with learning

Answer:`)

  return RunnableSequence.from([
    chatPrompt,
    chatModel,
    new StringOutputParser(),
  ])
}

// Question Generation Chain for Exams
export const createQuestionGenerationChain = () => {
  const questionPrompt = PromptTemplate.fromTemplate(`
You are an expert educator creating exam questions from document content.

Document Content:
{content}

Instructions:
- Generate {numQuestions} multiple-choice questions
- Each question should have 4 options (A, B, C, D)
- Questions should test understanding, not just memorization
- Include a mix of difficulty levels
- Provide detailed explanations for correct answers

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Detailed explanation of why this answer is correct..."
  }
]

Generate the questions:`)

  return RunnableSequence.from([
    questionPrompt,
    questionGenerationModel,
    new StringOutputParser(),
  ])
}

// Sourcing Strategy Chain for Talent Sourcers
export const createSourcingStrategyChain = (userLanguage: string = 'en') => {
  const sourcingPrompt = PromptTemplate.fromTemplate(`
You are a talent sourcing expert helping to create outreach strategies.

Talent Profiles:
{talentProfiles}

Sourcer Requirements:
{requirements}

Instructions:
- Respond in ${userLanguage === 'en' ? 'English' : userLanguage}
- Create a personalized outreach strategy for each talent
- Include key talking points and value propositions
- Suggest the best communication channels
- Provide email templates and messaging suggestions
- Consider cultural nuances and professional etiquette

Create a comprehensive sourcing strategy:`)

  return RunnableSequence.from([
    sourcingPrompt,
    chatModel,
    new StringOutputParser(),
  ])
}