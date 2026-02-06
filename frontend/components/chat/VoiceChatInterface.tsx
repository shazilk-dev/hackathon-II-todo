"use client";

/**
 * Voice-enabled Chat Interface with ChatKit
 *
 * Custom chat interface that wraps OpenAI ChatKit with voice input capability.
 * Uses Web Speech API for voice recognition and provides a custom input bar.
 */

import { useEffect, useState, useRef } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import {
  getChatKitClientSecret,
  getStoredThreadId,
  saveThreadId,
} from "@/lib/api/chatkit";
import { Send, Mic, MicOff, Loader2, RefreshCw } from "lucide-react";

interface VoiceChatInterfaceProps {
  onNewChat?: () => void;
}

export function VoiceChatInterface({ onNewChat }: VoiceChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Track current thread ID locally
  const [threadId, setLocalThreadId] = useState<string | null>(
    getStoredThreadId,
  );

  // Initialize ChatKit
  const { control, setThreadId, sendUserMessage } = useChatKit({
    api: {
      getClientSecret: getChatKitClientSecret,
    },
    initialThread: threadId || undefined,
    theme: {
      colorScheme: "light",
      radius: "round",
      color: {
        accent: { primary: "#4f46e5", level: 2 },
      },
    },
    header: { enabled: false },
    composer: { placeholder: "Type a message..." },
  });

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setRecognitionSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        setIsRecording(false);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendUserMessage({ text: input.trim() });
      setInput("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setThreadId(null as unknown as string);
    setLocalThreadId(null);
    saveThreadId(null);
    setInput("");
    onNewChat?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
        <div>
          <h1 className="text-lg font-semibold text-content-primary">
            Chat Assistant
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            Manage your tasks with natural language{" "}
            {recognitionSupported && "or voice"}
          </p>
        </div>
        {threadId && (
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* ChatKit Messages Container (with hidden input) */}
      <div className="flex-1 overflow-hidden rounded-2xl bg-surface-raised border border-border-subtle">
        <div className="h-full chatkit-custom-container">
          <ChatKit
            control={control}
            className="h-full"
            // Hide ChatKit's default input using CSS
            style={
              {
                "--chatkit-input-display": "none",
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* Custom Input Bar */}
      <div className="mt-3 flex-shrink-0">
        <div className="flex items-center gap-2 p-1.5 bg-surface-raised border border-border-subtle rounded-2xl shadow-sm">
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording ? "Listening..." : "Type a message or use voice..."
            }
            className="flex-1 bg-transparent text-sm text-content-primary placeholder-slate-400 outline-none px-3 py-2.5 leading-relaxed"
            disabled={isSending || isRecording}
            aria-label="Chat message input"
          />

          {/* Voice Button */}
          {recognitionSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isSending}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-action-primary text-content-inverse flex items-center justify-center hover:bg-action-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-content-tertiary text-center mt-2">
          {recognitionSupported
            ? "Enter to send · Click mic for voice input"
            : "Enter to send · Voice input not supported in this browser"}
        </p>
      </div>

      {/* Custom CSS to hide ChatKit's default input and fix message colors */}
      <style jsx global>{`
        /* Hide ChatKit's default input */
        .chatkit-custom-container [class*="input"],
        .chatkit-custom-container [class*="Input"],
        .chatkit-custom-container textarea,
        .chatkit-custom-container form {
          display: var(--chatkit-input-display, none) !important;
        }

        /* Adjust ChatKit message container to fill space */
        .chatkit-custom-container > div {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chatkit-custom-container [class*="messages"],
        .chatkit-custom-container [class*="Messages"] {
          flex: 1;
          overflow-y: auto;
        }

        /* Fix ChatKit user message colors - WHITE TEXT on BLUE BACKGROUND */
        .chatkit-custom-container [class*="user"] [class*="message"],
        .chatkit-custom-container [class*="User"] [class*="message"],
        .chatkit-custom-container [data-role="user"],
        .chatkit-custom-container [class*="message-user"],
        .chatkit-custom-container div[class*="user"] > div,
        .chatkit-custom-container div[class*="User"] > div {
          background-color: #2563eb !important; /* Blue-600 */
          color: #ffffff !important; /* White text */
        }

        /* Ensure text inside user messages is white */
        .chatkit-custom-container [class*="user"] [class*="message"] *,
        .chatkit-custom-container [class*="User"] [class*="message"] *,
        .chatkit-custom-container [data-role="user"] *,
        .chatkit-custom-container [class*="message-user"] * {
          color: #ffffff !important;
        }

        /* Assistant messages - keep light background with dark text */
        .chatkit-custom-container [class*="assistant"] [class*="message"],
        .chatkit-custom-container [class*="Assistant"] [class*="message"],
        .chatkit-custom-container [data-role="assistant"] {
          background-color: #f1f5f9 !important; /* Light gray */
          color: #1e293b !important; /* Dark text */
        }
      `}</style>
    </div>
  );
}
