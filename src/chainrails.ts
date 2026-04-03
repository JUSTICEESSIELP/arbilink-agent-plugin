/**
 * ChainRails cross-chain transaction utilities.
 * Enables AI agents to get quotes, find routes, create payment intents,
 * and check balances across chains — all settling on Arbitrum.
 */

import { crapi, Chainrails, Chains } from "@chainrails/sdk";
import type {
  Quote,
  Intent,
} from "@chainrails/sdk";

// ─── Init ────────────────────────────────────────────────────────────────────

export function initChainRails(apiKey: string) {
  Chainrails.config({ api_key: apiKey });
}

// ─── Supported Chains ────────────────────────────────────────────────────────

export async function getSupportedChains(
  network?: "mainnet" | "testnet",
): Promise<string[]> {
  return crapi.chains.getSupported({ network });
}

// ─── Cross-Chain Balance ─────────────────────────────────────────────────────

export async function getCrossChainBalance(
  address: `0x${string}`,
  network?: "mainnet" | "testnet",
): Promise<string> {
  return crapi.chains.getBalance({
    address,
    network,
    includeZeroBalances: false,
  });
}

// ─── Get Quotes ──────────────────────────────────────────────────────────────

export interface CrossChainQuoteInput {
  sourceChain: string;
  destinationChain: string;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  recipient: string;
}

export async function getCrossChainQuotes(
  input: CrossChainQuoteInput,
): Promise<{ quotes: Quote[]; cheapestOption: Quote }> {
  const result = await crapi.quotes.getFromAllBridges({
    sourceChain: input.sourceChain as any,
    destinationChain: input.destinationChain as any,
    tokenIn: input.tokenIn as `0x${string}`,
    tokenOut: input.tokenOut as `0x${string}`,
    amount: input.amount,
    excludeBridges: "",
    recipient: input.recipient as `0x${string}`,
  });
  return {
    quotes: result.quotes,
    cheapestOption: result.cheapestOption,
  };
}

export async function getBestQuote(
  input: CrossChainQuoteInput,
): Promise<Record<string, unknown>> {
  const result = await crapi.quotes.getBestAcrossBridges({
    sourceChain: input.sourceChain as any,
    destinationChain: input.destinationChain as any,
    tokenIn: input.tokenIn as `0x${string}`,
    tokenOut: input.tokenOut as `0x${string}`,
    amount: input.amount,
    recipient: input.recipient as `0x${string}`,
  });
  return {
    totalFee: result.totalFeeFormatted,
    depositAmount: result.depositAmountFormatted,
    bridge: result.route.bridge,
    sourceChain: result.route.sourceChain,
    destinationChain: result.route.destinationChain,
  };
}

// ─── Find Routes ─────────────────────────────────────────────────────────────

export interface FindRoutesInput {
  sourceChain: string;
  destinationChain: string;
  tokenIn: string;
  tokenOut: string;
  amount: string;
}

export async function findOptimalRoutes(
  input: FindRoutesInput,
): Promise<Record<string, unknown>> {
  const result = await crapi.router.getOptimalRoutes({
    sourceChain: input.sourceChain as any,
    destinationChain: input.destinationChain as any,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    amount: input.amount,
    amountSymbol: "USD",
  });
  return {
    sourceChain: result.sourceChain,
    destinationChain: result.destinationChain,
    tokenIn: result.tokenIn,
    tokenOut: result.tokenOut,
    totalFees: result.totalFees,
    bridgeToUse: result.bridgeToUse,
    supportedBridges: result.supportedBridges,
  };
}

export async function getSupportedBridges(
  sourceChain: string,
  destinationChain: string,
): Promise<Record<string, unknown>> {
  const result = await crapi.router.getSupportedBridges({
    sourceChain: sourceChain as any,
    destinationChain: destinationChain as any,
  });
  return {
    supportedBridges: result.supportedBridges,
    sourceChain: result.routeInfo.sourceChain,
    destinationChain: result.routeInfo.destinationChain,
    bridgeCount: result.routeInfo.bridgeCount,
    isSupported: result.routeInfo.isSupported,
  };
}

// ─── Create Payment Intent ───────────────────────────────────────────────────

export interface CreateIntentInput {
  sender: string;
  recipient: string;
  amount: string;
  tokenIn: string;
  sourceChain: string;
  destinationChain: string;
  description: string;
  reference: string;
}

export async function createPaymentIntent(
  input: CreateIntentInput,
): Promise<Record<string, unknown>> {
  const intent = await crapi.intents.create({
    sender: input.sender as `0x${string}`,
    recipient: input.recipient as `0x${string}`,
    refund_address: input.sender as `0x${string}`,
    amount: input.amount,
    tokenIn: input.tokenIn as `0x${string}`,
    amountSymbol: "USD",
    source_chain: input.sourceChain,
    destination_chain: input.destinationChain,
    metadata: {
      description: input.description,
      reference: input.reference,
    },
  });
  return {
    intentId: intent.id,
    status: intent.intent_status,
    intentAddress: intent.intent_address,
    sender: intent.sender,
    recipient: intent.recipient,
    amount: intent.initialAmount,
    totalAmountUSD: intent.total_amount_in_usd,
    fees: intent.fees_in_usd,
    sourceChain: intent.source_chain,
    destinationChain: intent.destination_chain,
    expiresAt: intent.expires_at,
  };
}

// ─── Get Intent Status ───────────────────────────────────────────────────────

export async function getIntentStatus(
  intentId: string,
): Promise<Record<string, unknown>> {
  const intent = await crapi.intents.getById(intentId);
  return {
    intentId: intent.id,
    status: intent.intent_status,
    sender: intent.sender,
    recipient: intent.recipient,
    amount: intent.initialAmount,
    totalAmountUSD: intent.total_amount_in_usd,
    txHash: intent.tx_hash,
    sourceChain: intent.source_chain,
    destinationChain: intent.destination_chain,
    createdAt: intent.created_at,
    expiresAt: intent.expires_at,
  };
}

// ─── Available Chains Constant ───────────────────────────────────────────────

export const AVAILABLE_CHAINS = Object.values(Chains).join(", ");
