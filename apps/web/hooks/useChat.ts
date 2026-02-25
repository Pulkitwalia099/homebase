"use client";

import { useState, useEffect } from "react";
import type { ChatMessage, ScopingQuoteData } from "@/lib/types";
import { startScopingSession, sendScopingMessage } from "@/lib/api-client";

const STORAGE_KEY = "homebase_chat";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm HomeBase's plumbing specialist. I'll help you figure out what's going on and give you a guaranteed fixed price in just a few questions.\n\nWhat's the plumbing issue today?",
};

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadFromStorage(): { messages: ChatMessage[]; sessionId: string | null } | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(messages: ChatMessage[], sessionId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, sessionId }));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChat() {
  // Start with server-safe defaults (matches SSR output), restore from localStorage after mount
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // isMounted becomes true after the first client-side render is complete.
  // Used to defer any localStorage-dependent UI until after hydration.
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setMessages(stored.messages);
      setSessionId(stored.sessionId);
    }
    setIsMounted(true);
  }, []);

  // Wrapper that sets state and persists in one call
  const updateMessages = (msgs: ChatMessage[], sid: string | null) => {
    setMessages(msgs);
    saveToStorage(msgs, sid);
  };

  // Clear chat and start fresh
  const clearChat = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setMessages([GREETING]);
    setSessionId(null);
  };

  const sendMessage = async (userMessage: string) => {
    if (isLoading) return;

    // Append user message immediately for responsive feel
    const currentSid = sessionId;
    const withUser: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    updateMessages(withUser, currentSid);
    setIsLoading(true);

    try {
      const response = !currentSid
        ? await startScopingSession(userMessage)
        : await sendScopingMessage(currentSid, userMessage);

      if (response.error || !response.data) {
        const errMsgs: ChatMessage[] = [
          ...withUser,
          {
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          },
        ];
        updateMessages(errMsgs, currentSid);
        return;
      }

      const { session_id, message, is_classified, quote: quoteData } = response.data;
      const newSid = currentSid ?? session_id;

      if (!currentSid) setSessionId(newSid);

      if (is_classified && quoteData) {
        // 1. Append the AI's final text message
        // 2. Append a quote bubble message (empty content, quoteData attached)
        const finalMsgs: ChatMessage[] = [
          ...withUser,
          { role: "assistant", content: message },
          { role: "assistant", content: "", quoteData: quoteData as ScopingQuoteData },
        ];
        updateMessages(finalMsgs, newSid);
      } else {
        const nextMsgs: ChatMessage[] = [
          ...withUser,
          { role: "assistant", content: message },
        ];
        updateMessages(nextMsgs, newSid);
      }
    } catch {
      const errMsgs: ChatMessage[] = [
        ...withUser,
        {
          role: "assistant",
          content: "Something went wrong on my end. Please refresh and try again.",
        },
      ];
      updateMessages(errMsgs, currentSid);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sessionId, sendMessage, clearChat, isMounted };
}
