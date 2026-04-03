/**
 * Arbitrum chain interaction utilities using viem.
 * Provides balance checks, gas estimation, token queries, contract reads,
 * and EIP-8004 agent identity verification via the oracle API.
 */

import {
  createPublicClient,
  http,
  formatEther,
  formatUnits,
  parseAbi,
  type Address,
  type PublicClient,
} from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import type { PluginConfig } from "./config.js";

// ─── Chain Clients ───────────────────────────────────────────────────────────

export function getClient(config: PluginConfig, chain?: "arbitrum" | "arbitrum-sepolia"): PublicClient {
  const target = chain ?? config.defaultChain;
  if (target === "arbitrum-sepolia") {
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(config.sepoliaRpcUrl),
    });
  }
  return createPublicClient({
    chain: arbitrum,
    transport: http(config.rpcUrl),
  });
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export async function getEthBalance(
  config: PluginConfig,
  address: string,
  chain?: "arbitrum" | "arbitrum-sepolia",
): Promise<{ address: string; balance: string; chain: string }> {
  const client = getClient(config, chain);
  const balance = await client.getBalance({ address: address as Address });
  return {
    address,
    balance: formatEther(balance),
    chain: chain ?? config.defaultChain,
  };
}

// ─── ERC-20 Token Balance ────────────────────────────────────────────────────

const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]);

export async function getTokenBalance(
  config: PluginConfig,
  walletAddress: string,
  tokenAddress: string,
  chain?: "arbitrum" | "arbitrum-sepolia",
): Promise<{ wallet: string; token: string; symbol: string; balance: string; chain: string }> {
  const client = getClient(config, chain);
  const addr = walletAddress as Address;
  const token = tokenAddress as Address;

  const [rawBalance, decimals, symbol] = await Promise.all([
    client.readContract({ address: token, abi: ERC20_ABI, functionName: "balanceOf", args: [addr] }),
    client.readContract({ address: token, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address: token, abi: ERC20_ABI, functionName: "symbol" }),
  ]);

  return {
    wallet: walletAddress,
    token: tokenAddress,
    symbol: symbol as string,
    balance: formatUnits(rawBalance as bigint, decimals as number),
    chain: chain ?? config.defaultChain,
  };
}

// ─── Gas Price ───────────────────────────────────────────────────────────────

export async function getGasInfo(
  config: PluginConfig,
  chain?: "arbitrum" | "arbitrum-sepolia",
): Promise<{ gasPrice: string; chain: string; blockNumber: string }> {
  const client = getClient(config, chain);
  const [gasPrice, blockNumber] = await Promise.all([
    client.getGasPrice(),
    client.getBlockNumber(),
  ]);
  return {
    gasPrice: `${formatUnits(gasPrice, 9)} Gwei`,
    chain: chain ?? config.defaultChain,
    blockNumber: blockNumber.toString(),
  };
}

// ─── Block Info ──────────────────────────────────────────────────────────────

export async function getBlockInfo(
  config: PluginConfig,
  blockNumber?: bigint,
  chain?: "arbitrum" | "arbitrum-sepolia",
): Promise<Record<string, unknown>> {
  const client = getClient(config, chain);
  const block = blockNumber
    ? await client.getBlock({ blockNumber })
    : await client.getBlock();

  return {
    number: block.number?.toString(),
    hash: block.hash,
    timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
    transactions: block.transactions.length,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    chain: chain ?? config.defaultChain,
  };
}

// ─── Contract Read ───────────────────────────────────────────────────────────

export async function readContract(
  config: PluginConfig,
  contractAddress: string,
  abi: string,
  functionName: string,
  args: unknown[],
  chain?: "arbitrum" | "arbitrum-sepolia",
): Promise<unknown> {
  const client = getClient(config, chain);
  const parsedAbi = parseAbi([abi]);
  const result = await client.readContract({
    address: contractAddress as Address,
    abi: parsedAbi,
    functionName,
    args,
  });
  return result;
}

// ─── Transaction Lookup ──────────────────────────────────────────────────────

export async function getTransaction(
  config: PluginConfig,
  txHash: string,
  chain?: "arbitrum" | "arbitrum-sepolia",
): Promise<Record<string, unknown>> {
  const client = getClient(config, chain);
  const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: formatEther(tx.value),
    gasPrice: tx.gasPrice ? `${formatUnits(tx.gasPrice, 9)} Gwei` : "N/A",
    blockNumber: tx.blockNumber?.toString(),
    chain: chain ?? config.defaultChain,
  };
}

// ─── EIP-8004 Oracle: Agent Identity ─────────────────────────────────────────

export async function checkAgentRegistration(
  config: PluginConfig,
  address: string,
): Promise<Record<string, unknown>> {
  const url = `${config.oracleEndpoint}/v1/registered/${address}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Oracle API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<Record<string, unknown>>;
}

export async function getRegistryStats(
  config: PluginConfig,
): Promise<Record<string, unknown>> {
  const url = `${config.oracleEndpoint}/v1/stats`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Oracle API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<Record<string, unknown>>;
}

export async function discoverAgents(
  config: PluginConfig,
  chain?: string,
): Promise<unknown[]> {
  const url = chain
    ? `${config.oracleEndpoint}/v1/agents?chain=${chain}`
    : `${config.oracleEndpoint}/v1/agents`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Oracle API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<unknown[]>;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function formatResult(label: string, data: Record<string, unknown>): string {
  const lines = [`── ${label} ──`];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`  ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
  }
  return lines.join("\n");
}
