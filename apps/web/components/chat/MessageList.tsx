"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  onSend: (msg: string) => void;
}

export function MessageList({ messages, isLoading, sessionId, onSend }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Index of the last assistant message — chips are only active on this one
  const lastAssistantIdx = messages.reduce(
    (acc, msg, i) => (msg.role === "assistant" ? i : acc),
    -1
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          message={msg}
          sessionId={sessionId}
          onSend={onSend}
          isLast={i === lastAssistantIdx}
          isLoading={isLoading}
        />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
