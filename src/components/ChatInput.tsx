"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Sparkles, Wallet, ArrowRightLeft, Banknote } from "lucide-react";
import { useWalletStore } from "@/store/wallet";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const QUICK_COMMANDS = [
  { text: "What's my portfolio worth?", icon: Wallet },
  { text: "Swap 50 XLM to USDC", icon: ArrowRightLeft },
  { text: "Lend my USDC at the best rate", icon: Banknote },
  { text: "Show me all lending pools", icon: Sparkles },
];

export function ChatInput({ onSendMessage, disabled = false, isLoading = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const { isConnected } = useWalletStore();

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || disabled || !isConnected) return;
    
    onSendMessage(trimmedInput);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Connect your wallet to start</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your Freighter wallet to interact with Stellar DeFi through chat
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick commands */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Try saying:</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand(cmd.text)}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <Icon className="h-3 w-3" />
                {cmd.text}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Input area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your DeFi command... (e.g., 'swap 50 XLM to USDC', 'lend my USDC', 'what's my portfolio?')"
                className="min-h-[60px] resize-none pr-12"
                disabled={disabled || !isConnected}
              />
              <div className="absolute right-3 bottom-3">
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || disabled || isLoading}
                  size="icon"
                  className="h-8 w-8"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
            <div>
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send •{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift</kbd> +{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> for new line
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Powered by DeepSeek AI</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}