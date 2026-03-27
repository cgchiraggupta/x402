"use client";

import { cn } from "@/lib/utils";
import { User, Bot, CheckCircle, AlertCircle } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/store/chat";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: ChatMessageType;
  onApproveTransaction?: (xdr: string) => void;
  onRejectTransaction?: () => void;
}

export function ChatMessage({
  message,
  onApproveTransaction,
  onRejectTransaction,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasPendingTransaction = !!message.pendingXDR;
  const hasTransactionHash = !!message.transactionHash;
  const isLoading = message.isLoading;

  const formatContent = (content: string) => {
    // Simple markdown-like formatting for AI responses
    return content.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h3
            key={i}
            className="text-sm font-semibold mt-4 mb-2 text-white/90 uppercase tracking-wider"
          >
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-base font-bold mt-5 mb-2 text-white">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-lg font-bold mt-6 mb-3 text-white">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div key={i} className="flex items-start gap-2 mb-2">
            <span className="text-primary mt-1 text-[10px]">▶</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <div key={i} className="flex items-start gap-2 mb-2">
            <span className="text-primary/70 font-mono text-xs mt-0.5">
              {line.split(".")[0]}.
            </span>
            <span>{line.substring(line.indexOf(" ") + 1)}</span>
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }

      // Handle bolding within text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      if (parts.length > 1) {
        return (
          <p key={i} className="mb-2 leading-relaxed">
            {parts.map((part, index) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={index} className="font-semibold text-white/90">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      }

      return (
        <p key={i} className="mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  const renderTransactionStatus = () => {
    if (hasTransactionHash) {
      return (
        <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-500 tracking-wide uppercase">
                Execution Confirmed
              </div>
              <div className="text-xs text-green-500/80 mt-1">
                Successfully settled on Stellar Network
              </div>
              <div className="mt-3 text-[10px] text-green-500/60 font-mono bg-green-500/5 border border-green-500/10 p-2 rounded-lg break-all">
                Hash: {message.transactionHash}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (hasPendingTransaction) {
      return (
        <div className="mt-5 p-5 rounded-2xl bg-[#0a0a0c] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-50 pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-white tracking-wide">
                  Action Required
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Review and sign transaction in Freighter
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onApproveTransaction?.(message.pendingXDR!)}
                className="flex-1 btn-pill py-2.5 flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black border-none"
              >
                <CheckCircle className="w-4 h-4" />
                Sign & Execute
              </button>
              <button
                onClick={onRejectTransaction}
                className="flex-1 btn-pill py-2.5 bg-transparent border border-white/20 text-white hover:bg-white/5"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "flex gap-4 mb-8 w-full animate-fade-in-up",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border",
          isUser
            ? "bg-white/10 border-white/20 backdrop-blur-md"
            : "bg-gradient-to-br from-primary to-accent border-transparent",
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white/80" />
        ) : isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 max-w-[85%] md:max-w-[75%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Message metadata */}
        <div
          className={cn(
            "flex items-center gap-2 mb-1.5 px-1",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isUser ? "text-white/40" : "text-primary/80",
            )}
          >
            {isUser ? "You" : "StarDeFi Agent"}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4 w-full relative group",
            isUser
              ? "bg-white/10 text-white border border-white/10 rounded-tr-sm"
              : "bg-[#111113] text-white/80 border border-white/5 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
            hasPendingTransaction && !isUser && "ring-1 ring-primary/30",
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
              <span className="text-sm font-medium text-white/50 tracking-wide uppercase text-[10px] animate-pulse">
                Processing intent...
              </span>
            </div>
          ) : (
            <div className="text-[14px] whitespace-pre-wrap flex-col space-y-1">
              {formatContent(message.content)}
              {renderTransactionStatus()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
