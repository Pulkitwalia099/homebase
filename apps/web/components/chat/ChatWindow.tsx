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
      <div className="border-b border-navy-light/20 bg-navy px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-amber flex items-center justify-center text-white font-bold text-sm">
          HB
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-white">HomeBase AI</h1>
          <p className="text-xs text-green flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block animate-pulse" />
            Plumbing specialist
          </p>
        </div>
        {/* Start over — only shown after mount (avoids SSR hydration mismatch) */}
        {isMounted && messages.length > 1 && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
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
