"use client";

import { useState, useEffect, useRef } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TransactionPreview } from "@/components/TransactionPreview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useWalletStore } from "@/store/wallet";
import { useChatStore, ChatMessage as ChatMessageType } from "@/store/chat";
import { FreighterConnector } from "@/connectors/freighter";
import { submitTransaction } from "@/lib/stellar/submit";
import { get_wallet_balances } from "@/lib/tools/wallet";
import { Bot, Sparkles } from "lucide-react";

export default function HomePage() {
  const { address, isConnected, setBalances } = useWalletStore();
  const { messages, addMessage, updateMessage, setLoading, clearChat } = useChatStore();
  
  const [showTransactionPreview, setShowTransactionPreview] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    xdr: string;
    type: "swap" | "deposit" | "withdraw";
    details: any;
  } | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Load initial message
  useEffect(() => {
    if (messages.length === 0 && isConnected) {
      addMessage({
        role: "assistant",
        content: `Hello! I'm StarDeFi, your AI assistant for Stellar DeFi. I can help you:\n\n• Swap tokens (XLM, USDC, BTC, ETH)\n• Earn yield by lending on Blend\n• Check your portfolio value\n• Find the best rates\n\nTry saying: "swap 50 XLM to USDC" or "lend my USDC at the best rate"`,
      });
    }
  }, [isConnected, messages.length, addMessage]);

  const handleSendMessage = async (content: string) => {
    if (!address || !isConnected) return;

    // Add user message
    const userMessageId = crypto.randomUUID();
    addMessage({
      id: userMessageId,
      role: "user",
      content,
    });

    // Add loading message
    const loadingMessageId = crypto.randomUUID();
    addMessage({
      id: loadingMessageId,
      role: "assistant",
      content: "",
      isLoading: true,
    });

    setLoading(true);

    try {
      // Get current balances for context
      const balances = await get_wallet_balances(address);

      // Call chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          walletAddress: address,
          balances: balances.map(b => ({
            asset: b.assetCode,
            balance: b.balance,
            usdValue: b.usdValue,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Update loading message with actual response
      updateMessage(loadingMessageId, {
        content: data.message || "I couldn't process that request.",
        isLoading: false,
        pendingXDR: data.pendingXDR,
      });

      // If there's a pending transaction, show preview
      if (data.pendingXDR && data.transactionDetails) {
        setPendingTransaction({
          xdr: data.pendingXDR,
          type: data.transactionDetails.type,
          details: data.transactionDetails,
        });
        setShowTransactionPreview(true);
      }

      // Refresh balances after action
      if (data.pendingXDR) {
        const newBalances = await get_wallet_balances(address);
        setBalances(newBalances);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      updateMessage(loadingMessageId, {
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        isLoading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async () => {
    if (!pendingTransaction || !address) return;

    setShowTransactionPreview(false);

    // Add signing message
    const signingMessageId = crypto.randomUUID();
    addMessage({
      id: signingMessageId,
      role: "assistant",
      content: "Signing transaction in Freighter...",
    });

    try {
      // Sign transaction with Freighter
      const signedXDR = await FreighterConnector.signTransaction(pendingTransaction.xdr);
      
      if (!signedXDR) {
        throw new Error("User rejected or signing failed");
      }

      // Submit transaction
      updateMessage(signingMessageId, {
        content: "Submitting transaction to Stellar network...",
      });

      const result = await submitTransaction(signedXDR);

      if (result.success) {
        updateMessage(signingMessageId, {
          content: `✅ Transaction confirmed! Hash: ${result.hash.slice(0, 16)}...`,
          transactionHash: result.hash,
        });

        // Refresh balances
        const newBalances = await get_wallet_balances(address);
        setBalances(newBalances);
      } else {
        throw new Error("Transaction submission failed");
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      
      updateMessage(signingMessageId, {
        content: `❌ Transaction failed: ${error.message}`,
      });
    }

    setPendingTransaction(null);
  };

  const handleRejectTransaction = () => {
    setShowTransactionPreview(false);
    setPendingTransaction(null);
    
    // Add rejection message
    addMessage({
      role: "assistant",
      content: "Transaction cancelled. Let me know if you'd like to try something else!",
    });
  };

  const handleApproveFromChat = (xdr: string) => {
    if (pendingTransaction) {
      handleApproveTransaction();
    }
  };

  const handleRejectFromChat = () => {
    handleRejectTransaction();
  };

  const handleClearChat = () => {
    clearChat();
    
    if (isConnected) {
      addMessage({
        role: "assistant",
        content: "Chat cleared! How can I help you with Stellar DeFi today?",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">StarDeFi AI</h1>
                <p className="text-muted-foreground">
                  Interact with Stellar DeFi through plain English
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span>Powered by DeepSeek AI</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Wallet */}
          <div className="lg:col-span-1">
            <WalletConnect />
            
            {isConnected && messages.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleClearChat}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear chat history
                </button>
              </div>
            )}
          </div>

          {/* Main chat area */}
          <div className="lg:col-span-2 space-y-6">
            {showTransactionPreview && pendingTransaction ? (
              <TransactionPreview
                type={pendingTransaction.type}
                details={pendingTransaction.details}
                onApprove={handleApproveTransaction}
                onReject={handleRejectTransaction}
              />
            ) : (
              <Card className="h-[600px] flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <ScrollArea 
                    ref={scrollAreaRef}
                    className="h-full p-6"
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Welcome to StarDeFi AI
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                          Connect your wallet to start interacting with Stellar DeFi through natural language.
                          Swap tokens, earn yield, and manage your portfolio with simple commands.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((message) => (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            onApproveTransaction={handleApproveFromChat}
                            onRejectTransaction={handleRejectFromChat}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <Separator />

                <div className="p-6">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={!isConnected}
                  />
                </div>
              </Card>
            )}

            {/* Info footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <div className="font-medium">Supported Actions</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Token swaps (XLM, USDC, BTC, ETH)</li>
                  <li>Lending on Blend protocol</li>
                  <li>Portfolio balance queries</li>
                </ul>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Example Commands</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>"swap 50 XLM to USDC"</li>
                  <li>"lend my USDC at the best rate"</li>
                  <li>"what's my portfolio worth?"</li>
                </ul>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Network</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Stellar Testnet</li>
                  <li>5-second finality</li>
                  <li>Near-zero fees</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
