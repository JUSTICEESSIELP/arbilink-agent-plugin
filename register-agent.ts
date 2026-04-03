/**
 * Register the ArbiLink agent on the Arbitrum identity registry using the official agent0 SDK.
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx register-agent.ts [--sepolia]
 *
 * Uses agent0-sdk with registryOverrides for Arbitrum chain support.
 * Registers fully on-chain (data URI) — no IPFS needed.
 */

import { SDK } from "agent0-sdk";

// ─── Config ──────────────────────────────────────────────────────────────────

const useSepolia = process.argv.includes("--sepolia");

// Arbitrum chain IDs
const ARBITRUM_ONE_CHAIN_ID = 42161;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

const chainId = useSepolia ? ARBITRUM_SEPOLIA_CHAIN_ID : ARBITRUM_ONE_CHAIN_ID;
const chainName = useSepolia ? "Arbitrum Sepolia" : "Arbitrum One";
const rpcUrl = useSepolia
  ? "https://sepolia-rollup.arbitrum.io/rpc"
  : "https://arb1.arbitrum.io/rpc";

// Arbitrum registry addresses (from the hackathon spec)
const ARBITRUM_ONE_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const ARBITRUM_SEPOLIA_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
// Reputation registry (same pattern as other chains)
const ARBITRUM_ONE_REPUTATION = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
const ARBITRUM_SEPOLIA_REPUTATION = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

const registryAddress = useSepolia ? ARBITRUM_SEPOLIA_REGISTRY : ARBITRUM_ONE_REGISTRY;
const reputationAddress = useSepolia ? ARBITRUM_SEPOLIA_REPUTATION : ARBITRUM_ONE_REPUTATION;

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: Set PRIVATE_KEY environment variable");
    console.error("  PRIVATE_KEY=0x... npx tsx register-agent.ts [--sepolia]");
    process.exit(1);
  }

  console.log(`Chain:    ${chainName} (${chainId})`);
  console.log(`Registry: ${registryAddress}`);
  console.log(`RPC:      ${rpcUrl}`);
  console.log();

  // Initialize agent0 SDK with Arbitrum chain support via overrides
  const sdk = new SDK({
    chainId,
    rpcUrl,
    privateKey,
    registryOverrides: {
      [chainId]: {
        IDENTITY: registryAddress,
        REPUTATION: reputationAddress,
      },
    },
  });

  console.log("Creating agent...");

  // Create the ArbiLink agent
  const agent = sdk.createAgent(
    "ArbiLink",
    "AI agent plugin enabling interaction with Arbitrum — balances, gas, tokens, smart contract reads, and EIP-8004 agent identity verification. Built as an OpenClaw plugin.",
    "https://raw.githubusercontent.com/JUSTICEESSIELP/arbilink-agent-plugin/main/agent-registration.json",
  );

  // Configure agent endpoints
  await agent.setMCP("https://clawhub.ai/plugins/arbilink");
  agent.setActive(true);
  agent.setX402Support(true);
  agent.setTrust(true, false, false); // reputation=true, cryptoEconomic=false, teeAttestation=false

  console.log("Registering agent on-chain (fully on-chain data URI)...");

  // Register on-chain — encodes the registration file as a data URI (no IPFS needed)
  const txHandle = await agent.registerOnChain();

  console.log(`Tx Hash:  ${txHandle.hash}`);
  console.log("Waiting for transaction confirmation...");
  const mined = await txHandle.waitMined();

  console.log();
  console.log("=== Agent Registered Successfully! ===");
  console.log(`Agent ID: ${agent.agentId}`);
  console.log(`Tx Hash:  ${txHandle.hash}`);
  console.log(`Block:    ${mined.receipt.blockNumber}`);
  console.log();

  const explorer = useSepolia
    ? `https://sepolia.arbiscan.io/tx/${txHandle.hash}`
    : `https://arbiscan.io/tx/${txHandle.hash}`;
  console.log(`Explorer: ${explorer}`);
  console.log();
  console.log("Registration complete! Your agent is now on the Arbitrum identity registry.");
}

main().catch((err) => {
  console.error("Registration failed:", err.message || err);
  if (err.message?.includes("insufficient funds")) {
    console.error();
    console.error("Your wallet needs ETH for gas. Get testnet ETH from:");
    console.error("  https://arbitrum.faucet.dev/");
    console.error("  https://faucet.quicknode.com/arbitrum/sepolia");
  }
  process.exit(1);
});
