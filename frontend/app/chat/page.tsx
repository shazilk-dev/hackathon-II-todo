"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import type { ToolCall } from "@/lib/api";
import { Send, RefreshCw, Bot, User, Loader2 } from "lucide-react";

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
  timestamp: Date;
}

const STORAGE_KEY = "chat_conversation_id";

const SUGGESTED_PROMPTS = [
  "Show me all my tasks",
  'Add a new task called "Buy groceries"',
  "What tasks are still pending?",
  "Complete my first task",
];

function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const toolConfig: Record<string, { label: string; className: string }> = {
    add_task: { label: "Task Added", className: "text-state-success bg-state-success-light" },
    list_tasks: { label: "Tasks Listed", className: "text-state-info bg-state-info-light" },
    complete_task: { label: "Task Completed", className: "text-state-success bg-state-success-light" },
    update_task: { label: "Task Updated", className: "text-state-warning bg-state-warning-light" },
    delete_task: { label: "Task Deleted", className: "text-state-error bg-state-error-light" },
  };

  const config = toolConfig[toolCall.tool] ?? {
    label: toolCall.tool,
    className: "text-content-secondary bg-surface-base border border-border-subtle",
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-opacity hover:opacity-75 ${config.className}`}
      >
        {config.label}
        <svg
          className={`w-2.5 h-2.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-1.5 px-2 py-1.5 bg-surface-base border border-border-subtle rounded-lg">
          <pre className="text-[10px] text-content-secondary whitespace-pre-wrap break-words">
            {JSON.stringify(toolCall.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { data: session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userId = session?.user?.id;

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, authLoading, router]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input after auth resolves
  useEffect(() => {
    if (!authLoading && session) {
      inputRef.current?.focus();
    }
  }, [authLoading, session]);

  // Persist conversation ID
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (conversationId !== null) {
        localStorage.setItem(STORAGE_KEY, conversationId.toString());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!userId || !text.trim() || isLoading) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user" as const,
          content: text.trim(),
          timestamp: new Date(),
        },
      ]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.sendChat(userId, {
          conversation_id: conversationId,
          message: text.trim(),
        });

        if (response.conversation_id !== conversationId) {
          setConversationId(response.conversation_id);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant" as const,
            content: response.response,
            tool_calls: response.tool_calls?.length ? response.tool_calls : undefined,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, conversationId, isLoading]
  );

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-5 h-5 text-action-primary animate-spin" />
          </div>
          <p className="text-xs text-content-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <Header />

      <div
        className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-3 sm:px-4 pt-4 pb-3"
        style={{ height: "calc(100vh - 60px)" }}
      >
        {/* Page header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-content-primary">Chat Assistant</h1>
            <p className="text-xs text-content-secondary mt-0.5">
              Manage your tasks with natural language
            </p>
          </div>
          {hasMessages && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin rounded-2xl bg-surface-raised border border-border-subtle p-4">
          {/* Empty state */}
          {!hasMessages && !isLoading && (
            <div className="min-h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-action-secondary flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-action-primary" />
              </div>

              {conversationId !== null ? (
                <>
                  <h2 className="text-base font-semibold text-content-primary mb-1">
                    Resuming previous conversation
                  </h2>
                  <p className="text-xs text-content-secondary mb-4 max-w-[280px]">
                    Your previous context is loaded. Send a message to continue, or start fresh.
                  </p>
                  <button
                    onClick={handleNewChat}
                    className="text-xs text-action-primary hover:underline transition-colors"
                  >
                    Start a new conversation
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-content-primary mb-1">
                    How can I help you today?
                  </h2>
                  <p className="text-xs text-content-secondary mb-5 max-w-[320px]">
                    I can help you add, list, complete, update, and delete tasks using natural
                    language.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[400px]">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-left px-3 py-2.5 rounded-xl border border-border-subtle bg-surface-base hover:bg-action-ghost-hover text-xs text-content-secondary hover:text-content-primary transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Message list */}
          {hasMessages && (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                      msg.role === "user" ? "bg-action-primary" : "bg-action-secondary"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3.5 h-3.5 text-content-inverse" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-action-primary" />
                    )}
                  </div>

                  {/* Message bubble + meta */}
                  <div
                    className={`flex-1 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    style={{ maxWidth: "85%" }}
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2 ${
                        msg.role === "user"
                          ? "bg-action-primary text-content-inverse rounded-tr-sm"
                          : "bg-surface-base border border-border-subtle text-content-primary rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Tool call badges */}
                    {msg.tool_calls && (
                      <div className="mt-1.5 flex flex-col gap-1 items-start">
                        {msg.tool_calls.map((tc, i) => (
                          <ToolCallBadge key={i} toolCall={tc} />
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] text-content-tertiary mt-1 px-0.5">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className={`flex items-start gap-2.5 ${hasMessages ? "mt-4" : ""}`}>
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-action-secondary flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-action-primary" />
              </div>
              <div className="bg-surface-base border border-border-subtle rounded-2xl rounded-tl-sm px-3.5 py-3">
                <div className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-action-primary animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-action-primary animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-action-primary animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className={`p-3 bg-state-error-light rounded-xl border border-red-200 ${hasMessages ? "mt-4" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-state-error">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-state-error hover:opacity-70 transition-opacity"
                  aria-label="Dismiss error"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mt-3 flex-shrink-0"
        >
          <div className="flex items-end gap-2 p-1.5 bg-surface-raised border border-border-subtle rounded-2xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-content-primary placeholder-slate-400 outline-none px-3 py-2 leading-relaxed"
              style={{ minHeight: "40px", maxHeight: "128px" }}
              disabled={isLoading}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-action-primary text-content-inverse flex items-center justify-center hover:bg-action-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-content-tertiary text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
