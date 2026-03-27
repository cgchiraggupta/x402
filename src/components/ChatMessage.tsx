"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Bot, CheckCircle, AlertCircle } from "lucide-react";
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
  onRejectTransaction 
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const hasPendingTransaction = !!message.pendingXDR;
  const hasTransactionHash = !!message.transactionHash;
  const isLoading = message.isLoading;

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4">{line.substring(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="ml-4">{line}</li>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return <p key={i} className="mb-2">{line}</p>;
      });
  };

  const renderTransactionStatus = () => {
    if (hasTransactionHash) {
      return (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Transaction confirmed!</span>
          </div>
          <div className="mt-1 text-xs text-green-600 dark:text-green-500">
            Hash: {message.transactionHash?.slice(0, 16)}...
          </div>
        </div>
      );
    }

    if (hasPendingTransaction) {
      return (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Transaction ready</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-500 mb-3">
            Review and approve the transaction in your wallet.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onApproveTransaction?.(message.pendingXDR!)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Approve
            </button>
            <button
              onClick={onRejectTransaction}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn(
      "flex gap-3 mb-6",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className={cn(
        "h-8 w-8",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}>
        <AvatarFallback>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "flex-1 space-y-1",
        isUser ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? "You" : "StarDeFi"}
          </span>
          <Badge 
            variant={isUser ? "default" : "secondary"} 
            className="text-xs"
          >
            {isUser ? "User" : "AI Assistant"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>

        <Card className={cn(
          "max-w-[85%]",
          isUser 
            ? "bg-primary text-primary-foreground border-primary" 
            : "bg-card"
        )}>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            ) : (
              <>
                <div className={cn(
                  "prose prose-sm dark:prose-invert max-w-none",
                  isUser && "text-primary-foreground"
                )}>
                  {formatContent(message.content)}
                </div>
                {renderTransactionStatus()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}