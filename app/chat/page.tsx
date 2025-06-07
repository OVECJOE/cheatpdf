"use client";

import { Brain, Sparkles } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
          Ready to Chat with Your PDFs?
        </h2>
        <p className="text-gray-600 mb-6 text-sm lg:text-base">
          Select a document and start a new chat to begin asking
          questions about your study materials.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-5 text-sm text-gray-600">
          <div className="flex items-center gap-2 justify-start w-max min-w-40 border border-dashed border-amber-200 rounded-lg px-3 py-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Ask questions about your documents</span>
          </div>
          <div className="flex items-center gap-2 justify-start w-max min-w-40 border border-dashed border-amber-200 rounded-lg px-3 py-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Get instant, accurate answers</span>
          </div>
          <div className="flex items-center gap-2 justify-start w-max min-w-40 border border-dashed border-amber-200 rounded-lg px-3 py-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Learn faster with AI assistance</span>
          </div>
        </div>
      </div>
    </div>
  );
}