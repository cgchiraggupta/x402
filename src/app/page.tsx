"use client";

import { useState, useEffect, useRef } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TransactionPreview } from "@/components/TransactionPreview";
import { TransactionHistory } from "@/components/TransactionHistory";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWalletStore } from "@/store/wallet";
import { useChatStore } from "@/store/chat";
import { useTransactionStore, createTransactionFromAI } from "@/store/transaction";
import { FreighterConnector } from "@/connectors/freighter";
import { submitTransaction } from "@/lib/stellar/submit";
import { get_wallet_balances } from "@/lib/tools/wallet";
import { Sparkles, ArrowUpRight, ShieldCheck, Activity, History } from "lucide-react";

export default function HomePage() {
  const {
    address,
    isConnected,
    setAddress,
    setConnected,
    setConnecting,
    setNetwork,
    setBalances,
    setPortfolioValueUSD,
  } = useWalletStore();

  const { messages, addMessage, updateMessage, setLoading, clearChat } =
    useChatStore();

  const { addTransaction } = useTransactionStore();

  const [showTransactionPreview, setShowTransactionPreview] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    xdr: string;
    type: "swap" | "deposit" | "withdraw" | "x402";
    details: any;
  } | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
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
        content: `Welcome to the future of DeFi. I'm your StarDeFi AI. How can we grow your portfolio today?\n\nTry commands like:\n- "Swap 50 XLM to USDC"\n- "Lend my USDC for yield"\n- "What's my portfolio worth?"`,
      });
    }
  }, [isConnected, messages.length, addMessage]);

  const handleGlobalConnect = async () => {
    const installed = await FreighterConnector.checkInstalled();
    if (!installed) {
      window.open("https://www.freighter.app/", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const { success, publicKey } =
        await FreighterConnector.completeConnection();

      if (success && publicKey) {
        setAddress(publicKey);
        setConnected(true);

        const currentNetwork = await FreighterConnector.getNetwork();
        setNetwork(currentNetwork);

        const balances = await get_wallet_balances(publicKey);
        setBalances(balances);

        const totalValue = balances.reduce(
          (sum, b) => sum + (b.usdValue || 0),
          0,
        );
        setPortfolioValueUSD(totalValue);

        // Auto scroll to terminal after connection
        document
          .getElementById("wallet-connect")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!address || !isConnected) return;

    const userMessageId = crypto.randomUUID();
    addMessage({
      id: userMessageId,
      role: "user",
      content,
    });

    const loadingMessageId = crypto.randomUUID();
    addMessage({
      id: loadingMessageId,
      role: "assistant",
      content: "",
      isLoading: true,
    });

    setLoading(true);

    try {
      const balances = await get_wallet_balances(address);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          walletAddress: address,
          balances: balances.map((b) => ({
            asset: b.assetCode,
            balance: b.balance,
            usdValue: b.usdValue,
          })),
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();

      updateMessage(loadingMessageId, {
        content: data.message || "I couldn't process that request.",
        isLoading: false,
        pendingXDR: data.pendingXDR,
      });

      if (data.pendingXDR && data.transactionDetails) {
        setPendingTransaction({
          xdr: data.pendingXDR,
          type: data.transactionDetails.type,
          details: data.transactionDetails,
        });
        setShowTransactionPreview(true);
      } else if (data.transactionDetails && data.transactionDetails.type === "x402") {
        // x402 transactions don't need wallet signing, add directly to history
        const tx = createTransactionFromAI(
          "x402",
          data.transactionDetails,
          address,
          data.transactionDetails.transactionHash
        );
        addTransaction(tx);
      }

      if (data.pendingXDR) {
        const newBalances = await get_wallet_balances(address);
        setBalances(newBalances);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error sending message:", error);
      updateMessage(loadingMessageId, {
        content: `Transaction error: ${error.message}. Please try again.`,
        isLoading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async () => {
    if (!pendingTransaction || !address) return;
    setShowTransactionPreview(false);

    const signingMessageId = crypto.randomUUID();
    addMessage({
      id: signingMessageId,
      role: "assistant",
      content: "Awaiting signature in Freighter...",
    });

    try {
      const signedXDR = await FreighterConnector.signTransaction(
        pendingTransaction.xdr,
      );
      if (!signedXDR) throw new Error("Signature rejected");

      updateMessage(signingMessageId, {
        content: "Executing on Stellar network...",
      });

      const result = await submitTransaction(signedXDR);

      if (result.success) {
        updateMessage(signingMessageId, {
          content: `✅ Execution confirmed. Hash: ${result.hash.slice(0, 16)}...`,
          transactionHash: result.hash,
        });
        
        // Add to transaction history
        const tx = createTransactionFromAI(
          pendingTransaction.type,
          pendingTransaction.details,
          address,
          result.hash
        );
        addTransaction(tx);
        
        const newBalances = await get_wallet_balances(address);
        setBalances(newBalances);
      } else {
        throw new Error("Network submission failed");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      updateMessage(signingMessageId, {
        content: `❌ Failed: ${error.message}`,
      });
    }

    setPendingTransaction(null);
  };

  const handleRejectTransaction = () => {
    setShowTransactionPreview(false);
    setPendingTransaction(null);
    addMessage({
      role: "assistant",
      content: "Action cancelled. Ready for your next command.",
    });
  };

  const handleClearChat = () => {
    clearChat();
    if (isConnected) {
      addMessage({
        role: "assistant",
        content: "Session cleared. How can I assist you today?",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative overflow-x-hidden text-foreground selection:bg-primary/30">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Floating Navigation */}
      <nav className="fixed top-6 inset-x-0 z-50 flex justify-center px-4 animate-fade-in-up">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between w-full max-w-6xl shadow-2xl border-white/10">
          <button
            onClick={() => {
              handleClearChat();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            title="Go back to Home"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,0,127,0.5)]">
              {/* Added support for custom Perry logo - save as public/logo.png */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://upload.wikimedia.org/wikipedia/en/d/dc/Perry_the_Platypus.png"
                alt="StarDeFi Logo"
                className="w-full h-full object-cover object-top scale-[1.35] translate-y-1"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden",
                  );
                }}
              />
              <span className="text-white font-bold text-sm hidden">✦</span>
            </div>
            <span className="text-lg font-bold tracking-wide">STARDEFI</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Testnet
            </div>
            {isConnected ? (
              <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium">
                Connected
              </div>
            ) : (
              <button onClick={handleGlobalConnect} className="btn-pill group">
                Connect Wallet
                <div className="btn-pill-icon">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto relative z-10">
        {/* Dynamic Hero Section */}
        <div className="flex flex-col items-center justify-center text-center mt-12 mb-20 animate-fade-in-up">
          <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm mb-8 flex items-center gap-2 text-white/80 shadow-[0_0_20px_rgba(255,0,127,0.1)]">
            <Sparkles className="w-4 h-4 text-primary" /> Stellar Hacks
            Hackathon
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-tight">
            Meet{" "}
            <span className="text-gradient-primary italic pr-2">
              StarDeFi AI
            </span>
          </h1>

          <p className="text-muted-foreground text-lg mb-10 max-w-2xl leading-relaxed">
            Interact with the Stellar blockchain using natural language. Connect
            your wallet to swap tokens, check your portfolio, and earn yield
            seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleGlobalConnect}
              className="btn-pill group px-8 py-3 text-base shadow-[0_0_20px_rgba(255,0,127,0.25)]"
            >
              Start Terminal
              <div className="btn-pill-icon h-7 w-7">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </button>
            <button
              onClick={() => {
                window.open("https://github.com/cgchiraggupta/x402", "_blank");
              }}
              className="px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors font-medium hover:shadow-lg active:scale-95"
            >
              GitHub Repo
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
            <div
              className="relative group cursor-default"
              style={{ animationDelay: "100ms" }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-100 transition duration-500" />
              <div className="glass-panel relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 bg-[#0a0a0c]/90 h-full border-white/10 group-hover:border-primary/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(255,0,127,0.2)]">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">
                  Secure Execution
                </h3>
                <p className="text-sm text-muted-foreground">
                  Transactions are built by AI but always signed locally by your
                  Freighter wallet. Your keys never leave your device.
                </p>
              </div>
            </div>
            <div
              className="relative group cursor-default"
              style={{ animationDelay: "200ms" }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 to-primary/30 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-100 transition duration-500" />
              <div className="glass-panel relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 bg-[#0a0a0c]/90 h-full border-white/10 group-hover:border-accent/50">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(125,0,255,0.2)]">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">
                  Real-time Yield
                </h3>
                <p className="text-sm text-muted-foreground">
                  Instantly access the best lending rates across the Stellar
                  Blend protocol and track your portfolio&apos;s performance.
                </p>
              </div>
            </div>
            <div
              className="relative group cursor-default"
              style={{ animationDelay: "300ms" }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-100 transition duration-500" />
              <div className="glass-panel relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 bg-[#0a0a0c]/90 h-full border-white/10 group-hover:border-primary/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(255,0,127,0.2)]">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">
                  Natural Language
                </h3>
                <p className="text-sm text-muted-foreground">
                  Just type &quot;Swap 50 XLM to USDC&quot;. Our sophisticated
                  intent engine handles the complex pathfinding and routing
                  behind the scenes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard / Workspace Area */}
        <div
          id="wallet-connect"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up transition-all duration-700 scroll-mt-32"
        >
          {/* Left Panel - Portfolio/Wallet & History */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-1 rounded-[2rem] shadow-2xl">
              <div className="bg-[#0a0a0c] rounded-[1.8rem] p-5 h-full border border-white/5">
                <WalletConnect />

                {isConnected && messages.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <button
                      onClick={handleClearChat}
                      className="w-full py-3 px-4 rounded-xl border border-white/5 text-sm text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                      Clear Session History
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            {isConnected && (
              <div className="glass-panel p-1 rounded-[2rem] shadow-2xl">
                <div className="bg-[#0a0a0c] rounded-[1.8rem] p-5 h-full border border-white/5">
                  <TransactionHistory />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI Terminal */}
          <div className="lg:col-span-8">
            <div className="glass-panel rounded-[2rem] p-1 h-[calc(100vh-12rem)] min-h-[600px] flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(255,0,127,0.05)]">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="bg-[#0a0a0c]/90 rounded-[1.8rem] flex flex-col h-full border border-white/5 backdrop-blur-md">
                {/* Terminal Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                    <span className="font-semibold text-sm tracking-wide text-white/90">
                      StarDeFi Terminal
                    </span>
                  </div>
                  <div
                    className={`text-xs font-mono px-2 py-1 rounded-md font-bold tracking-wider ${isConnected ? "text-green-400 bg-green-400/10" : "text-amber-400 bg-amber-400/10"}`}
                  >
                    Status: {isConnected ? "Online" : "Awaiting Connection"}
                  </div>
                </div>

                {/* Interaction Area */}
                <div className="flex-1 overflow-hidden relative">
                  {showTransactionPreview && pendingTransaction ? (
                    <div className="absolute inset-0 z-20 bg-[#0a0a0c]/95 backdrop-blur-xl p-6 flex flex-col justify-center animate-fade-in-up">
                      <TransactionPreview
                        type={pendingTransaction.type}
                        details={pendingTransaction.details}
                        onApprove={handleApproveTransaction}
                        onReject={handleRejectTransaction}
                      />
                    </div>
                  ) : null}

                  <ScrollArea ref={scrollAreaRef} className="h-full p-6">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-100">
                        <Activity className="w-12 h-12 text-primary mb-4" />
                        <p className="text-sm text-white/90 font-medium">
                          System ready. Connect your wallet to initialize the
                          secure DeFi terminal and start executing commands.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 max-w-3xl mx-auto pb-4">
                        {messages.map((message) => (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            onApproveTransaction={handleApproveTransaction}
                            onRejectTransaction={handleRejectTransaction}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent rounded-b-[1.8rem]">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={!isConnected}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
