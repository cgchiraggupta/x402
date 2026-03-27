"use client";

import { useState, KeyboardEvent } from "react";
import {
  Send,
  Sparkles,
  Wallet,
  ArrowRightLeft,
  Banknote,
  Activity,
} from "lucide-react";
import { useWalletStore } from "@/store/wallet";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const QUICK_COMMANDS = [
  { text: "What's my portfolio worth?", icon: Wallet },
  { text: "Swap 50 XLM to USDC", icon: ArrowRightLeft },
  { text: "Lend my USDC for yield", icon: Banknote },
  { text: "Show me all lending pools", icon: Sparkles },
];

export function ChatInput({
  onSendMessage,
  disabled = false,
  isLoading = false,
}: ChatInputProps) {
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
      <div className="w-full flex items-center justify-center p-8 rounded-[1.5rem] bg-black/40 border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="flex flex-col items-center gap-3 z-10 text-center">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Wallet className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-sm font-medium text-white/40 tracking-wide uppercase">
            Awaiting Connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] uppercase tracking-wider font-bold text-white/70 px-1">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickCommand(cmd.text)}
                disabled={disabled || isLoading}
                className="px-3 py-1.5 rounded-full bg-[#111113] hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm"
              >
                <Icon className="w-3 h-3 text-primary" />
                {cmd.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="relative group mt-2">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none"></div>
        <div className="relative flex gap-3 bg-[#111113] rounded-[1.4rem] border border-white/10 p-2 shadow-2xl transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask StarDeFi to swap, lend, or analyze..."
            className="w-full min-h-[52px] max-h-[200px] resize-none bg-transparent border-none !text-white caret-white placeholder:text-white/50 px-4 py-3.5 focus:outline-none focus:ring-0 text-sm leading-relaxed"
            disabled={disabled || !isConnected || isLoading}
            rows={1}
            style={{ scrollbarWidth: "none" }}
          />
          <div className="flex items-end pb-1 pr-1">
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled || isLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent hover:opacity-90 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,0,127,0.3)] hover:shadow-[0_0_25px_rgba(255,0,127,0.5)] text-white shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 translate-x-px" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2 text-[10px] text-white/50 uppercase tracking-wider font-bold mt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="font-sans font-bold bg-white/10 border border-white/20 px-1.5 py-0.5 rounded text-white/70 shadow-sm">
              ↵
            </kbd>{" "}
            Send
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="font-sans font-bold bg-white/10 border border-white/20 px-1.5 py-0.5 rounded text-white/70 shadow-sm">
              ⇧
            </kbd>{" "}
            +{" "}
            <kbd className="font-sans font-bold bg-white/10 border border-white/20 px-1.5 py-0.5 rounded text-white/70 shadow-sm">
              ↵
            </kbd>{" "}
            New Line
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-primary/90">
          <Activity className="w-3 h-3" />
          <span>DeepSeek Intelligence Engine</span>
        </div>
      </div>
    </div>
  );
}
