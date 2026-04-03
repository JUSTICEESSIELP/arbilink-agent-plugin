import { Type } from "@sinclair/typebox";
import type { GatewayRequestHandlerOptions, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { resolvePluginConfig, validateConfig, type PluginConfig } from "./src/config.js";
import {
  formatError,
  formatResult,
  getEthBalance,
  getTokenBalance,
  getGasInfo,
  getBlockInfo,
  getTransaction,
  readContract,
  checkAgentRegistration,
  getRegistryStats,
  discoverAgents,
} from "./src/utils.js";
import { registerArbiLinkCli } from "./src/cli.js";
import { setPluginRuntime, getPluginRuntime } from "./src/runtime.js";
import {
  initChainRails,
  getSupportedChains,
  getCrossChainBalance,
  getCrossChainQuotes,
  getBestQuote,
  findOptimalRoutes,
  getSupportedBridges,
  createPaymentIntent,
  getIntentStatus,
  AVAILABLE_CHAINS,
} from "./src/chainrails.js";

// ─── Parameter Schemas ───────────────────────────────────────────────────────

const ChainParam = Type.Optional(
  Type.Union([Type.Literal("arbitrum"), Type.Literal("arbitrum-sepolia")], {
    description: 'Target chain: "arbitrum" or "arbitrum-sepolia"',
  }),
);

const AddressParam = Type.String({ description: "Ethereum/Arbitrum address (0x…)" });

const BalanceSchema = Type.Object({
  address: AddressParam,
  chain: ChainParam,
});

const TokenBalanceSchema = Type.Object({
  walletAddress: AddressParam,
  tokenAddress: Type.String({ description: "ERC-20 token contract address" }),
  chain: ChainParam,
});

const GasSchema = Type.Object({ chain: ChainParam });

const BlockSchema = Type.Object({
  blockNumber: Type.Optional(Type.String({ description: "Block number (omit for latest)" })),
  chain: ChainParam,
});

const TxSchema = Type.Object({
  hash: Type.String({ description: "Transaction hash" }),
  chain: ChainParam,
});

const ContractReadSchema = Type.Object({
  contractAddress: AddressParam,
  abiSignature: Type.String({ description: 'Solidity function signature, e.g. "function balanceOf(address) view returns (uint256)"' }),
  functionName: Type.String({ description: "Function name to call" }),
  args: Type.Array(Type.String({ description: "Function arguments as strings" })),
  chain: ChainParam,
});

const AgentCheckSchema = Type.Object({
  address: AddressParam,
});

// ─── Plugin Config Schema ────────────────────────────────────────────────────

const pluginConfigSchema = {
  parse(value: PluginConfig): PluginConfig {
    return resolvePluginConfig(value);
  },
  uiHints: {
    enabled: { label: "Enable Plugin", help: "Toggle to enable or disable ArbiLink" },
    rpcUrl: { label: "Arbitrum One RPC", help: "RPC endpoint for Arbitrum One mainnet" },
    sepoliaRpcUrl: { label: "Arbitrum Sepolia RPC", help: "RPC endpoint for Arbitrum Sepolia testnet" },
    defaultChain: { label: "Default Chain", help: '"arbitrum" or "arbitrum-sepolia"' },
    oracleEndpoint: { label: "EIP-8004 Oracle", help: "Agent identity oracle endpoint" },
    chainrailsApiKey: { label: "ChainRails API Key", help: "API key for cross-chain transactions via ChainRails" },
  },
};

// ─── Helper: wrap tool execution ─────────────────────────────────────────────

function toolResult(text: string, success: boolean) {
  return {
    content: [{ type: "text" as const, text }],
    details: { success, timestamp: new Date().toISOString() },
  };
}

// ─── Main Plugin ─────────────────────────────────────────────────────────────

const arbiLinkPlugin = {
  id: "arbilink",
  name: "ArbiLink — Arbitrum Agent Plugin",
  description:
    "Enables AI agents to interact with Arbitrum: check balances, read gas prices, query ERC-20 tokens, look up transactions, read smart contracts, and verify agent identity via EIP-8004.",
  configSchema: pluginConfigSchema,

  register(api: OpenClawPluginApi) {
    setPluginRuntime(api.runtime);
    const config = pluginConfigSchema.parse(api.pluginConfig);

    const validation = validateConfig(config);
    if (!validation.valid) {
      api.logger.warn(`[arbilink] Config validation failed: ${validation.errors.join("; ")}`);
    }
    if (!config.enabled) {
      api.logger.info("[arbilink] Plugin disabled, skipping registration");
      return;
    }

    api.logger.info("[arbilink] Initializing ArbiLink plugin for Arbitrum");

    // ── Tool: Get ETH Balance ──────────────────────────────────────────────

    api.registerTool({
      name: "arbilink_balance",
      label: "Arbitrum ETH Balance",
      description: "Get the ETH balance of an address on Arbitrum (One or Sepolia).",
      parameters: BalanceSchema,
      async execute(_id: string, params: { address: string; chain?: "arbitrum" | "arbitrum-sepolia" }) {
        try {
          const result = await getEthBalance(config, params.address, params.chain);
          return toolResult(formatResult("ETH Balance", result), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Get ERC-20 Token Balance ─────────────────────────────────────

    api.registerTool({
      name: "arbilink_token_balance",
      label: "Arbitrum Token Balance",
      description: "Get the ERC-20 token balance of a wallet on Arbitrum. Provide the token contract address.",
      parameters: TokenBalanceSchema,
      async execute(_id: string, params: { walletAddress: string; tokenAddress: string; chain?: "arbitrum" | "arbitrum-sepolia" }) {
        try {
          const result = await getTokenBalance(config, params.walletAddress, params.tokenAddress, params.chain);
          return toolResult(formatResult("Token Balance", result), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Gas Info ─────────────────────────────────────────────────────

    api.registerTool({
      name: "arbilink_gas",
      label: "Arbitrum Gas Price",
      description: "Get the current gas price and latest block number on Arbitrum.",
      parameters: GasSchema,
      async execute(_id: string, params: { chain?: "arbitrum" | "arbitrum-sepolia" }) {
        try {
          const result = await getGasInfo(config, params.chain);
          return toolResult(formatResult("Gas Info", result), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Block Info ───────────────────────────────────────────────────

    api.registerTool({
      name: "arbilink_block",
      label: "Arbitrum Block Info",
      description: "Get information about a specific block on Arbitrum, or the latest block.",
      parameters: BlockSchema,
      async execute(_id: string, params: { blockNumber?: string; chain?: "arbitrum" | "arbitrum-sepolia" }) {
        try {
          const blockNum = params.blockNumber ? BigInt(params.blockNumber) : undefined;
          const result = await getBlockInfo(config, blockNum, params.chain);
          return toolResult(formatResult("Block Info", result as Record<string, unknown>), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Transaction Lookup ───────────────────────────────────────────

    api.registerTool({
      name: "arbilink_tx",
      label: "Arbitrum Transaction Lookup",
      description: "Look up a transaction by its hash on Arbitrum.",
      parameters: TxSchema,
      async execute(_id: string, params: { hash: string; chain?: "arbitrum" | "arbitrum-sepolia" }) {
        try {
          const result = await getTransaction(config, params.hash, params.chain);
          return toolResult(formatResult("Transaction", result as Record<string, unknown>), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Read Smart Contract ──────────────────────────────────────────

    api.registerTool({
      name: "arbilink_read_contract",
      label: "Arbitrum Contract Read",
      description:
        'Read data from any smart contract on Arbitrum. Provide the ABI signature (e.g. "function totalSupply() view returns (uint256)"), function name, and arguments.',
      parameters: ContractReadSchema,
      async execute(
        _id: string,
        params: {
          contractAddress: string;
          abiSignature: string;
          functionName: string;
          args: string[];
          chain?: "arbitrum" | "arbitrum-sepolia";
        },
      ) {
        try {
          const result = await readContract(config, params.contractAddress, params.abiSignature, params.functionName, params.args, params.chain);
          const display = typeof result === "bigint" ? result.toString() : JSON.stringify(result, null, 2);
          return toolResult(`── Contract Read Result ──\n  ${params.functionName}: ${display}`, true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Check Agent Registration (EIP-8004) ──────────────────────────

    api.registerTool({
      name: "arbilink_agent_check",
      label: "EIP-8004 Agent Check",
      description:
        "Check if an address is registered as an AI agent in the EIP-8004 Identity Registry. Uses the public oracle API.",
      parameters: AgentCheckSchema,
      async execute(_id: string, params: { address: string }) {
        try {
          const result = await checkAgentRegistration(config, params.address);
          return toolResult(formatResult("Agent Registration", result as Record<string, unknown>), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Registry Stats ───────────────────────────────────────────────

    api.registerTool({
      name: "arbilink_registry_stats",
      label: "EIP-8004 Registry Stats",
      description: "Get statistics about the EIP-8004 Agent Identity Registry — total agents, per-chain counts, unique owners.",
      parameters: Type.Object({}),
      async execute() {
        try {
          const result = await getRegistryStats(config);
          return toolResult(formatResult("Registry Stats", result as Record<string, unknown>), true);
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── Tool: Discover Agents ──────────────────────────────────────────────

    api.registerTool({
      name: "arbilink_discover_agents",
      label: "Discover Registered Agents",
      description: "Discover AI agents registered in the EIP-8004 registry. Optionally filter by chain (ethereum, base).",
      parameters: Type.Object({
        chain: Type.Optional(Type.String({ description: 'Filter by chain: "ethereum" or "base"' })),
      }),
      async execute(_id: string, params: { chain?: string }) {
        try {
          const agents = await discoverAgents(config, params.chain);
          const count = Array.isArray(agents) ? agents.length : 0;
          const preview = Array.isArray(agents) ? agents.slice(0, 10) : agents;
          return toolResult(
            `── Discovered Agents (showing first 10 of ${count}) ──\n${JSON.stringify(preview, null, 2)}`,
            true,
          );
        } catch (err) {
          return toolResult(`Error: ${formatError(err)}`, false);
        }
      },
    });

    // ── ChainRails Cross-Chain Tools ──────────────────────────────────────

    if (config.chainrailsApiKey) {
      initChainRails(config.chainrailsApiKey);
      api.logger.info("[arbilink] ChainRails cross-chain tools enabled");

      // Tool: Supported Chains
      api.registerTool({
        name: "arbilink_supported_chains",
        label: "Supported Cross-Chain Networks",
        description: `List all blockchain networks supported for cross-chain transactions. Available chains include: ${AVAILABLE_CHAINS}`,
        parameters: Type.Object({
          network: Type.Optional(Type.Union([Type.Literal("mainnet"), Type.Literal("testnet")], { description: '"mainnet" or "testnet"' })),
        }),
        async execute(_id: string, params: { network?: "mainnet" | "testnet" }) {
          try {
            const chains = await getSupportedChains(params.network);
            return toolResult(`── Supported Chains ──\n${chains.join(", ")}`, true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });

      // Tool: Cross-Chain Balance
      api.registerTool({
        name: "arbilink_cross_chain_balance",
        label: "Cross-Chain Balance",
        description: "Get token balances for a wallet across all supported chains (Arbitrum, Ethereum, Base, Polygon, etc.).",
        parameters: Type.Object({
          address: Type.String({ description: "Wallet address (0x...)" }),
          network: Type.Optional(Type.Union([Type.Literal("mainnet"), Type.Literal("testnet")], { description: '"mainnet" or "testnet"' })),
        }),
        async execute(_id: string, params: { address: string; network?: "mainnet" | "testnet" }) {
          try {
            const balance = await getCrossChainBalance(params.address as `0x${string}`, params.network);
            return toolResult(`── Cross-Chain Balances ──\n${typeof balance === "string" ? balance : JSON.stringify(balance, null, 2)}`, true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });

      // Tool: Cross-Chain Quote
      api.registerTool({
        name: "arbilink_cross_chain_quote",
        label: "Cross-Chain Quote",
        description: `Get the best quote for a cross-chain transfer. Finds optimal bridge and fees. Chains: ${AVAILABLE_CHAINS}`,
        parameters: Type.Object({
          sourceChain: Type.String({ description: "Source chain (e.g. ETHEREUM, BASE, POLYGON, ARBITRUM)" }),
          destinationChain: Type.String({ description: "Destination chain (e.g. ARBITRUM, BASE, ETHEREUM)" }),
          tokenIn: Type.String({ description: "Input token contract address" }),
          tokenOut: Type.String({ description: "Output token contract address" }),
          amount: Type.String({ description: "Amount to transfer" }),
          recipient: Type.String({ description: "Recipient wallet address" }),
        }),
        async execute(_id: string, params: any) {
          try {
            const result = await getBestQuote(params);
            return toolResult(formatResult("Cross-Chain Quote", result), true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });

      // Tool: Find Routes
      api.registerTool({
        name: "arbilink_find_routes",
        label: "Find Cross-Chain Routes",
        description: "Find optimal routes for cross-chain transfers including bridge selection and fee estimation.",
        parameters: Type.Object({
          sourceChain: Type.String({ description: "Source chain (e.g. ETHEREUM, BASE, POLYGON)" }),
          destinationChain: Type.String({ description: "Destination chain (e.g. ARBITRUM)" }),
          tokenIn: Type.String({ description: "Input token address" }),
          tokenOut: Type.String({ description: "Output token address" }),
          amount: Type.String({ description: "Amount to transfer" }),
        }),
        async execute(_id: string, params: any) {
          try {
            const result = await findOptimalRoutes(params);
            return toolResult(formatResult("Optimal Route", result), true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });

      // Tool: Supported Bridges
      api.registerTool({
        name: "arbilink_supported_bridges",
        label: "Supported Bridges",
        description: "Check which bridges are available between two chains (ACROSS, CCTP, GATEWAY, RHINOFI).",
        parameters: Type.Object({
          sourceChain: Type.String({ description: "Source chain (e.g. ETHEREUM)" }),
          destinationChain: Type.String({ description: "Destination chain (e.g. ARBITRUM)" }),
        }),
        async execute(_id: string, params: { sourceChain: string; destinationChain: string }) {
          try {
            const result = await getSupportedBridges(params.sourceChain, params.destinationChain);
            return toolResult(formatResult("Supported Bridges", result), true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });

      // Tool: Create Payment Intent
      api.registerTool({
        name: "arbilink_create_intent",
        label: "Create Cross-Chain Payment",
        description: "Create a cross-chain payment intent. The sender deposits on the source chain and the recipient receives on the destination chain.",
        parameters: Type.Object({
          sender: Type.String({ description: "Sender wallet address" }),
          recipient: Type.String({ description: "Recipient wallet address" }),
          amount: Type.String({ description: "Amount in USD" }),
          tokenIn: Type.String({ description: "Input token address on source chain" }),
          sourceChain: Type.String({ description: "Source chain (e.g. ETHEREUM, BASE)" }),
          destinationChain: Type.String({ description: "Destination chain (e.g. ARBITRUM)" }),
          description: Type.String({ description: "Payment description" }),
          reference: Type.String({ description: "Payment reference ID" }),
        }),
        async execute(_id: string, params: any) {
          try {
            const result = await createPaymentIntent(params);
            return toolResult(formatResult("Payment Intent Created", result), true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });

      // Tool: Intent Status
      api.registerTool({
        name: "arbilink_intent_status",
        label: "Payment Intent Status",
        description: "Check the status of a cross-chain payment intent (PENDING, FUNDED, INITIATED, COMPLETED, EXPIRED).",
        parameters: Type.Object({
          intentId: Type.String({ description: "Intent ID to check" }),
        }),
        async execute(_id: string, params: { intentId: string }) {
          try {
            const result = await getIntentStatus(params.intentId);
            return toolResult(formatResult("Intent Status", result), true);
          } catch (err) {
            return toolResult(`Error: ${formatError(err)}`, false);
          }
        },
      });
    } else {
      api.logger.info("[arbilink] ChainRails API key not set — cross-chain tools disabled. Set chainrailsApiKey in config to enable.");
    }

    // ── Gateway Methods ────────────────────────────────────────────────────

    api.registerGatewayMethod("arbilink.balance", async ({ params, respond }: GatewayRequestHandlerOptions) => {
      try {
        const result = await getEthBalance(config, params.address, params.chain);
        respond(true, { success: true, result, timestamp: new Date().toISOString() });
      } catch (err) {
        respond(false, { error: formatError(err) });
      }
    });

    api.registerGatewayMethod("arbilink.gas", async ({ params, respond }: GatewayRequestHandlerOptions) => {
      try {
        const result = await getGasInfo(config, params.chain);
        respond(true, { success: true, result, timestamp: new Date().toISOString() });
      } catch (err) {
        respond(false, { error: formatError(err) });
      }
    });

    api.registerGatewayMethod("arbilink.agent-check", async ({ params, respond }: GatewayRequestHandlerOptions) => {
      try {
        const result = await checkAgentRegistration(config, params.address);
        respond(true, { success: true, result, timestamp: new Date().toISOString() });
      } catch (err) {
        respond(false, { error: formatError(err) });
      }
    });

    // ── CLI Registration ───────────────────────────────────────────────────

    api.registerCli(
      ({ program }) =>
        registerArbiLinkCli({ program, config, logger: api.logger }),
      { commands: ["arbilink"] },
    );

    // ── Commands ───────────────────────────────────────────────────────────

    api.registerCommand({
      name: "arbinfo",
      description: "Show ArbiLink plugin status and configuration",
      handler: () => ({
        text: [
          "ArbiLink — Arbitrum Agent Plugin",
          `  Chain: ${config.defaultChain}`,
          `  RPC: ${config.defaultChain === "arbitrum" ? config.rpcUrl : config.sepoliaRpcUrl}`,
          `  Oracle: ${config.oracleEndpoint}`,
          `  Registry: ${config.registryAddress}`,
          "",
          `  ChainRails: ${config.chainrailsApiKey ? "enabled" : "disabled (set chainrailsApiKey to enable)"}`,
          "",
          "Arbitrum tools: arbilink_balance, arbilink_token_balance, arbilink_gas,",
          "  arbilink_block, arbilink_tx, arbilink_read_contract",
          "Identity tools: arbilink_agent_check, arbilink_registry_stats, arbilink_discover_agents",
          "Cross-chain tools: arbilink_supported_chains, arbilink_cross_chain_balance,",
          "  arbilink_cross_chain_quote, arbilink_find_routes, arbilink_supported_bridges,",
          "  arbilink_create_intent, arbilink_intent_status",
        ].join("\n"),
      }),
    });

    // ── Service ────────────────────────────────────────────────────────────

    api.registerService({
      id: "arbilink-service",
      start: async () => {
        if (!config.enabled) return;
        api.logger.info("[arbilink] Service started — Arbitrum agent tools ready");
      },
      stop: async () => {
        api.logger.info("[arbilink] Service stopped");
      },
    });

    // ── Message Hook ───────────────────────────────────────────────────────

    api.on("message_received", async (event, ctx) => {
      if (event.content.includes("arbitrum") || event.content.includes("arbilink") || event.content.includes("arb")) {
        const channelId = ctx.channelId;
        const from = event.from;
        const sendMethod = getPluginRuntime().channel[channelId]?.[`sendMessage${channelId.charAt(0).toUpperCase() + channelId.slice(1)}`];
        if (sendMethod) {
          await sendMethod(
            from,
            "I detected an Arbitrum-related message! I have tools for checking balances, gas, tokens, transactions, and agent identity. Try '/arbinfo' to see what's available.",
            { accountId: ctx.accountId },
          );
        }
      }

      api.logger.info(`[arbilink] message received: ${event.content.substring(0, 100)}`);
    });

    const toolCount = config.chainrailsApiKey ? 16 : 9;
    api.logger.info(`[arbilink] Plugin initialization complete — ${toolCount} tools registered`);
  },
};

export default arbiLinkPlugin;
