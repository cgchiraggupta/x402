"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWalletStore } from "@/store/wallet";
import { FreighterConnector } from "@/connectors/freighter";
import { get_wallet_balances, TokenBalance, format_balance } from "@/lib/tools/wallet";
import { Loader2, Wallet, LogOut, RefreshCw } from "lucide-react";

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
      const { success, publicKey, error } = await FreighterConnector.completeConnection();
      
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
      const totalValue = balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0);
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFreighterInstalled ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Freighter wallet is not installed. Please install it to continue.
              </p>
              <Button 
                onClick={() => window.open("https://www.freighter.app/", "_blank")}
                className="w-full"
              >
                Install Freighter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Freighter wallet to interact with Stellar DeFi
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Freighter Wallet
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={network === "TESTNET" ? "secondary" : "default"}>
              {network || "Unknown"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isConnecting}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDisconnect}
              title="Disconnect"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {truncateAddress(address!)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Portfolio Value</span>
              <span className="text-lg font-bold">
                ${portfolioValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Balances</span>
              <span className="text-xs text-muted-foreground">
                {balances.length} token{balances.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-4">
                {balances.map((balance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{balance.assetCode}</div>
                      <div className="text-xs text-muted-foreground">
                        {balance.assetIssuer ? truncateAddress(balance.assetIssuer) : "Native"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {format_balance(balance)} {balance.assetCode}
                      </div>
                      {balance.usdValue && balance.usdValue > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ${balance.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {balances.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No token balances found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}