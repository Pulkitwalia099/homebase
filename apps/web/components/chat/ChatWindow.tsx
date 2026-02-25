"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { ChatMessage } from "@/lib/types";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  onSend: (message: string) => void;
  onClear: () => void;
  isMounted: boolean;
}

export function ChatWindow({ messages, isLoading, sessionId, onSend, onClear, isMounted }: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          HB
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-900">HomeBase AI</h1>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Plumbing specialist
          </p>
        </div>
        {/* Start over — only shown after mount (avoids SSR hydration mismatch) */}
        {isMounted && messages.length > 1 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Start over
          </button>
        )}
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} sessionId={sessionId} onSend={onSend} />

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
