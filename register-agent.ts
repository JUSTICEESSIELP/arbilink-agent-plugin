/**
 * Register the ArbiLink agent on the Arbitrum identity registry (EIP-8004).
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx register-agent.ts [--sepolia]
 *
 * The script will:
 *   1. Upload the agent-registration.json to a public URL (uses GitHub raw URL)
 *   2. Call register(agentURI) on the EIP-8004 IdentityRegistry contract
 *   3. Print the agentId and transaction hash
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, arbitrumSepolia } from "viem/chains";

// ─── Config ──────────────────────────────────────────────────────────────────

const useSepolia = process.argv.includes("--sepolia");

const REGISTRY_ADDRESS: Address = useSepolia
  ? "0x8004A818BFB912233c491871b3d84c89A494BD9e" // Arbitrum Sepolia
  : "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"; // Arbitrum One

const chain = useSepolia ? arbitrumSepolia : arbitrum;
const rpcUrl = useSepolia
  ? "https://sepolia-rollup.arbitrum.io/rpc"
  : "https://arb1.arbitrum.io/rpc";

// Agent registration file URL (hosted on GitHub)
const AGENT_URI =
  "https://raw.githubusercontent.com/JUSTICEESSIELP/arbilink-agent-plugin/main/agent-registration.json";

// EIP-8004 IdentityRegistry ABI (register function + Registered event)
const REGISTRY_ABI = parseAbi([
  "function register(string agentURI) external returns (uint256 agentId)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
]);

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: Set PRIVATE_KEY environment variable");
    console.error("  PRIVATE_KEY=0x... npx tsx register-agent.ts [--sepolia]");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`Chain:    ${chain.name}`);
  console.log(`Registry: ${REGISTRY_ADDRESS}`);
  console.log(`Wallet:   ${account.address}`);
  console.log(`AgentURI: ${AGENT_URI}`);
  console.log();

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance:  ${Number(balance) / 1e18} ETH`);

  if (balance === 0n) {
    console.error("\nError: Wallet has no ETH for gas. Fund it first:");
    if (useSepolia) {
      console.error("  Faucet: https://arbitrum.faucet.dev/");
      console.error("  Faucet: https://faucet.quicknode.com/arbitrum/sepolia");
    }
    process.exit(1);
  }

  console.log("\nRegistering agent...");

  // Call register(agentURI)
  const hash = await walletClient.writeContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "register",
    args: [AGENT_URI],
  });

  console.log(`Tx hash:  ${hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(`Status:   ${receipt.status === "success" ? "SUCCESS" : "FAILED"}`);
  console.log(`Block:    ${receipt.blockNumber}`);
  console.log(`Gas used: ${receipt.gasUsed}`);

  // Parse the Registered event to get agentId
  if (receipt.logs.length > 0) {
    // The first topic of the Registered event after the event signature is the agentId
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === REGISTRY_ADDRESS.toLowerCase() && log.topics.length >= 2) {
        const agentId = BigInt(log.topics[1]!);
        console.log(`\nAgent ID: ${agentId}`);
        console.log(`\nView on explorer:`);
        if (useSepolia) {
          console.log(`  https://sepolia.arbiscan.io/tx/${hash}`);
        } else {
          console.log(`  https://arbiscan.io/tx/${hash}`);
        }
        break;
      }
    }
  }

  console.log("\nAgent registered successfully!");
}

main().catch((err) => {
  console.error("Registration failed:", err.message || err);
  process.exit(1);
});
