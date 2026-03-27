"use client";
/* eslint-disable */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTransactionStore, Transaction } from "@/store/transaction";
import { useWalletStore } from "@/store/wallet";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Database,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  Wallet,
} from "lucide-react";

interface TransactionHistoryProps {
  maxItems?: number;
  className?: string;
}

export function TransactionHistory({
  maxItems = 10,
  className = "",
}: TransactionHistoryProps) {
  const { address } = useWalletStore();
  const { transactions, getTransactionsByWallet, clearTransactions } =
    useTransactionStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const walletTransactions = address
    ? getTransactionsByWallet(address).slice(0, maxItems)
    : [];

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "swap":
        return <ArrowUpRight className="h-4 w-4" />;
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4" />;
      case "x402":
        return <Database className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  const getTypeLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "swap":
        return "Swap";
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "x402":
        return "Data Purchase";
      default:
        return "Transaction";
    }
  };

  const formatAmount = (tx: Transaction) => {
    switch (tx.type) {
      case "swap":
        return `${tx.details.from} → ${tx.details.to}`;
      case "deposit":
        return `Deposit ${tx.amount} USDC`;
      case "withdraw":
        return `Withdraw ${tx.amount} USDC`;
      case "x402":
        return `Data: ${tx.details.query?.slice(0, 30)}...`;
      default:
        return tx.amount;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In real implementation, would sync from blockchain
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleClear = () => {
    if (confirm("Clear all transaction history?")) {
      clearTransactions();
    }
  };

  if (!address) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Connect your wallet to view transaction history
          </div>
        </CardContent>
      </Card>
    );
  }

  if (walletTransactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet
            <p className="text-sm mt-2">
              Execute swaps, lending, or data purchases to see history here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Transaction History
          <Badge variant="secondary" className="ml-2">
            {walletTransactions.length}
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {walletTransactions.map((tx) => (
              <div key={tx.id} className="group">
                <div className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getTypeLabel(tx.type)}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatAmount(tx)}
                      </p>
                      {tx.details.poolName && (
                        <p className="text-xs text-muted-foreground">
                          Pool: {tx.details.poolName}
                        </p>
                      )}
                      {tx.details.pricePaid && (
                        <p className="text-xs text-muted-foreground">
                          Paid: {tx.details.pricePaid} USDC
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {formatTime(tx.timestamp)}
                    </div>
                    {tx.explorerUrl && (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <Separator className="mt-4 group-last:hidden" />
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing {walletTransactions.length} of {transactions.length} total
          transactions
        </div>
      </CardContent>
    </Card>
  );
}
