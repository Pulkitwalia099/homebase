"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { DemoNavbar } from "@/components/demo/DemoNavbar";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { messages, isLoading, sessionId, sendMessage, clearChat, isMounted } = useChat();

  return (
    <div className="flex flex-col h-screen bg-warm-white">
      <DemoNavbar step="chat" />
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col min-h-0">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          sessionId={sessionId}
          onSend={sendMessage}
          onClear={clearChat}
          isMounted={isMounted}
        />
      </div>
    </div>
  );
}
