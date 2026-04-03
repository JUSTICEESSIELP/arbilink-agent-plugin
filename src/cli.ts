/**
 * CLI commands for the Arbitrum Agent Plugin.
 */

import type { PluginConfig } from "./config.js";
import {
  getEthBalance,
  getGasInfo,
  getTokenBalance,
  getBlockInfo,
  checkAgentRegistration,
  getRegistryStats,
  getTransaction,
  formatError,
  formatResult,
} from "./utils.js";

interface CliOptions {
  program: any;
  config: PluginConfig;
  logger: { info: (msg: string) => void; warn: (msg: string) => void };
}

export function registerArbiLinkCli({ program, config, logger }: CliOptions) {
  const arb = program.command("arbilink").description("Arbitrum agent tools — balances, gas, tokens, identity");

  arb
    .command("balance <address>")
    .option("--chain <chain>", "Chain: arbitrum | arbitrum-sepolia", config.defaultChain)
    .description("Get ETH balance for an address on Arbitrum")
    .action(async (address: string, opts: { chain: "arbitrum" | "arbitrum-sepolia" }) => {
      try {
        const result = await getEthBalance(config, address, opts.chain);
        console.log(formatResult("ETH Balance", result));
      } catch (err) {
        logger.warn(`[arbilink] balance error: ${formatError(err)}`);
      }
    });

  arb
    .command("token-balance <wallet> <token>")
    .option("--chain <chain>", "Chain: arbitrum | arbitrum-sepolia", config.defaultChain)
    .description("Get ERC-20 token balance")
    .action(async (wallet: string, token: string, opts: { chain: "arbitrum" | "arbitrum-sepolia" }) => {
      try {
        const result = await getTokenBalance(config, wallet, token, opts.chain);
        console.log(formatResult("Token Balance", result));
      } catch (err) {
        logger.warn(`[arbilink] token-balance error: ${formatError(err)}`);
      }
    });

  arb
    .command("gas")
    .option("--chain <chain>", "Chain: arbitrum | arbitrum-sepolia", config.defaultChain)
    .description("Get current gas price on Arbitrum")
    .action(async (opts: { chain: "arbitrum" | "arbitrum-sepolia" }) => {
      try {
        const result = await getGasInfo(config, opts.chain);
        console.log(formatResult("Gas Info", result));
      } catch (err) {
        logger.warn(`[arbilink] gas error: ${formatError(err)}`);
      }
    });

  arb
    .command("block [number]")
    .option("--chain <chain>", "Chain: arbitrum | arbitrum-sepolia", config.defaultChain)
    .description("Get block information")
    .action(async (number: string | undefined, opts: { chain: "arbitrum" | "arbitrum-sepolia" }) => {
      try {
        const blockNum = number ? BigInt(number) : undefined;
        const result = await getBlockInfo(config, blockNum, opts.chain);
        console.log(formatResult("Block Info", result as Record<string, unknown>));
      } catch (err) {
        logger.warn(`[arbilink] block error: ${formatError(err)}`);
      }
    });

  arb
    .command("tx <hash>")
    .option("--chain <chain>", "Chain: arbitrum | arbitrum-sepolia", config.defaultChain)
    .description("Look up a transaction by hash")
    .action(async (hash: string, opts: { chain: "arbitrum" | "arbitrum-sepolia" }) => {
      try {
        const result = await getTransaction(config, hash, opts.chain);
        console.log(formatResult("Transaction", result as Record<string, unknown>));
      } catch (err) {
        logger.warn(`[arbilink] tx error: ${formatError(err)}`);
      }
    });

  arb
    .command("agent-check <address>")
    .description("Check if an address is a registered EIP-8004 agent")
    .action(async (address: string) => {
      try {
        const result = await checkAgentRegistration(config, address);
        console.log(formatResult("Agent Registration", result as Record<string, unknown>));
      } catch (err) {
        logger.warn(`[arbilink] agent-check error: ${formatError(err)}`);
      }
    });

  arb
    .command("registry-stats")
    .description("Get EIP-8004 registry statistics")
    .action(async () => {
      try {
        const result = await getRegistryStats(config);
        console.log(formatResult("Registry Stats", result as Record<string, unknown>));
      } catch (err) {
        logger.warn(`[arbilink] registry-stats error: ${formatError(err)}`);
      }
    });
}
