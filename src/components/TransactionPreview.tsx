"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Wallet,
} from "lucide-react";

interface TransactionPreviewProps {
  type: "swap" | "deposit" | "withdraw" | "x402";
  details: {
    from?: string;
    to?: string;
    amount: string;
    slippage?: string;
    poolId?: string;
    poolName?: string;
    apr?: number;
    expectedOutput?: string;
    priceImpact?: string;
    fee?: string;
    query?: string;
    pricePaid?: number;
    result?: any;
    transactionHash?: string;
  };
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function TransactionPreview({
  type,
  details,
  onApprove,
  onReject,
  isLoading = false,
}: TransactionPreviewProps) {
  const getTitle = () => {
    switch (type) {
      case "swap":
        return `Swap ${details.amount} ${details.from} to ${details.to}`;
      case "deposit":
        return `Deposit ${details.amount} USDC to ${details.poolName || "Lending Pool"}`;
      case "withdraw":
        return `Withdraw ${details.amount} from ${details.poolName || "Lending Pool"}`;
      case "x402":
        return `x402 Data Purchase: ${details.query?.slice(0, 50)}${details.query && details.query.length > 50 ? "..." : ""}`;
      default:
        return "Transaction Preview";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "swap":
        return "Review swap details before approving";
      case "deposit":
        return "Review deposit details before approving";
      case "withdraw":
        return "Review withdrawal details before approving";
      case "x402":
        return "AI-powered data purchase using x402 protocol";
      default:
        return "Review transaction details";
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case "swap":
        return "secondary";
      case "deposit":
        return "default";
      case "withdraw":
        return "destructive";
      case "x402":
        return "default";
      default:
        return "outline";
    }
  };

  const getBadgeText = () => {
    switch (type) {
      case "swap":
        return "Swap";
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "x402":
        return "x402 AI Data";
      default:
        return "Transaction";
    }
  };

  const renderSwapDetails = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">From</div>
          <div className="text-lg font-semibold">
            {details.amount} {details.from}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">
            To (Estimated)
          </div>
          <div className="text-lg font-semibold">
            {details.expectedOutput} {details.to}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Price Impact</span>
          </div>
          <Badge
            variant={
              parseFloat(details.priceImpact || "0") > 1
                ? "destructive"
                : "secondary"
            }
          >
            {details.priceImpact || "< 0.1%"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Fee</span>
          </div>
          <span className="text-sm font-medium">{details.fee || "0.3%"}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Slippage Tolerance</span>
          </div>
          <span className="text-sm font-medium">
            {details.slippage || "0.5"}%
          </span>
        </div>
      </div>
    </div>
  );

  const renderDepositDetails = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Pool</div>
        <div className="text-lg font-semibold">
          {details.poolName || "USDC Lending Pool"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Amount</div>
        <div className="text-2xl font-bold">{details.amount} USDC</div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">APR</span>
          </div>
          <Badge variant="default" className="text-lg">
            {details.apr?.toFixed(1) || "8.5"}%
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Estimated Monthly Earnings</span>
          </div>
          <span className="text-sm font-medium">
            $
            {(
              (parseFloat(details.amount) * (details.apr || 8.5)) /
              100 /
              12
            ).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Withdrawal Period</span>
          </div>
          <span className="text-sm font-medium">Instant</span>
        </div>
      </div>
    </div>
  );

  const renderWithdrawDetails = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Pool</div>
        <div className="text-lg font-semibold">
          {details.poolName || "Lending Pool"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">
          Amount to Withdraw
        </div>
        <div className="text-2xl font-bold">{details.amount} USDC</div>
      </div>

      <Separator />

      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="text-sm text-yellow-700 dark:text-yellow-500">
            <p className="font-medium">
              Note: Withdrawing will stop earning yield on this amount.
            </p>
            <p className="mt-1">
              Funds will be available in your wallet immediately after
              transaction confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderX402Details = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Data Query</div>
        <div className="text-lg font-semibold">{details.query}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Price Paid</div>
          <div className="text-lg font-semibold">
            {details.pricePaid} USDC
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Transaction</div>
          <div className="text-sm font-mono truncate">
            {details.transactionHash?.slice(0, 16)}...
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Data Preview</div>
        <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(details.result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {getTitle()}
          </CardTitle>
          <Badge variant={getBadgeVariant()}>{getBadgeText()}</Badge>
        </div>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>

      <CardContent>
        {type === "swap" && renderSwapDetails()}
        {type === "deposit" && renderDepositDetails()}
        {type === "withdraw" && renderWithdrawDetails()}
        {type === "x402" && renderX402Details()}

        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-500">
              <p className="font-medium">
                This is a real blockchain transaction
              </p>
              <p className="mt-1">
                {type === "x402" 
                  ? "AI autonomously paid for premium data using x402 protocol"
                  : "You'll need to approve it in your Freighter wallet popup."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button onClick={onApprove} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Approve in Wallet"}
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
