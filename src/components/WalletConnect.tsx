"use client";

import { useState, useEffect } from "react";
import { useWalletStore } from "@/store/wallet";
import { FreighterConnector } from "@/connectors/freighter";
import { get_wallet_balances, format_balance } from "@/lib/tools/wallet";
import {
  Loader2,
  Wallet,
  LogOut,
  RefreshCw,
  ArrowUpRight,
  Activity,
} from "lucide-react";

export function WalletConnect() {
  const {
    address,
    balances,
    isConnected,
    isConnecting,
    network,
    portfolioValueUSD,
    setAddress,
    setBalances,
    setConnected,
    setConnecting,
    setNetwork,
    setPortfolioValueUSD,
    disconnect,
  } = useWalletStore();

  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);

  useEffect(() => {
    checkFreighter();
  }, []);

  const checkFreighter = async () => {
    const installed = await FreighterConnector.checkInstalled();
    setIsFreighterInstalled(installed);
  };

  const handleConnect = async () => {
    if (!isFreighterInstalled) {
      window.open("https://www.freighter.app/", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const { success, publicKey, error } =
        await FreighterConnector.completeConnection();

      if (success && publicKey) {
        setAddress(publicKey);
        setConnected(true);

        // Get network
        const currentNetwork = await FreighterConnector.getNetwork();
        setNetwork(currentNetwork);

        // Load balances
        await loadBalances(publicKey);
      } else {
        console.error("Connection failed:", error);
        alert(error || "Failed to connect wallet");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      alert("Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const loadBalances = async (walletAddress: string) => {
    try {
      const balances = await get_wallet_balances(walletAddress);
      setBalances(balances);

      // Calculate portfolio value
      const totalValue = balances.reduce(
        (sum, balance) => sum + (balance.usdValue || 0),
        0,
      );
      setPortfolioValueUSD(totalValue);
    } catch (error) {
      console.error("Failed to load balances:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    FreighterConnector.disconnect();
  };

  const handleRefresh = async () => {
    if (address) {
      await loadBalances(address);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full animate-fade-in-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-wide">
              Connect Wallet
            </h3>
            <p className="text-xs text-white/50">Access your Stellar assets</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          {!isFreighterInstalled ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
                <Activity className="w-8 h-8 text-red-500/80" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-2">
                  Freighter wallet not found
                </p>
                <p className="text-xs text-white/60 mb-6">
                  You need the Freighter extension to interact with Stellar
                  DeFi.
                </p>
              </div>
              <button
                onClick={() =>
                  window.open("https://www.freighter.app/", "_blank")
                }
                className="w-full btn-pill group py-3"
              >
                Install Freighter
                <div className="btn-pill-icon">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-3 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <p className="text-sm font-semibold text-white">
                  Freighter Detected
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Ready to initialize connection
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full btn-pill group py-3 flex items-center justify-center"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-black" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    Connect Freighter
                    <div className="btn-pill-icon">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-white/40 font-semibold uppercase tracking-wider">
                Secure local signing • No private keys shared
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Header Profile */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] border-2 border-[#0a0a0c]"></div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Connected</h3>
            <p className="text-xs font-mono text-muted-foreground">
              {truncateAddress(address!)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isConnecting}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors disabled:opacity-50"
            title="Refresh balances"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button
            onClick={handleDisconnect}
            title="Disconnect"
            className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Portfolio Total */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs font-medium text-white/70 mb-2 uppercase tracking-wider">
          Total Portfolio Value
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg text-white/80 font-medium">$</span>
          <span className="text-4xl font-bold tracking-tight text-white">
            {portfolioValueUSD.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold ${network === "TESTNET" ? "bg-amber-500/20 text-amber-500" : "bg-green-500/20 text-green-500"}`}
          >
            {network || "Unknown Network"}
          </span>
        </div>
      </div>

      {/* Balances List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-sm font-semibold text-white/90">Your Assets</h4>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
            {balances.length} asset{balances.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 -mr-2">
          {balances.map((balance, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center">
                  <span className="text-sm">
                    {balance.assetCode === "XLM"
                      ? "⭐"
                      : balance.assetCode === "USDC"
                        ? "💵"
                        : balance.assetCode === "BTC"
                          ? "₿"
                          : balance.assetCode === "ETH"
                            ? "Ξ"
                            : "💎"}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white/90">
                    {balance.assetCode}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">
                    {balance.assetIssuer
                      ? truncateAddress(balance.assetIssuer)
                      : "Native"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {format_balance(balance)}
                </div>
                {balance.usdValue && balance.usdValue > 0 && (
                  <div className="text-xs text-muted-foreground">
                    $
                    {balance.usdValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {balances.length === 0 && (
            <div className="py-10 mt-2 text-center bg-white/5 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center shadow-inner">
                <span className="text-xl">💰</span>
              </div>
              <p className="text-sm font-medium text-white/80 mb-1">
                No assets found
              </p>
              <p className="text-xs text-white/40">Fund your wallet to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
