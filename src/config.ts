/**
 * Configuration for the Arbitrum Agent Plugin.
 */

export interface PluginConfig {
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Arbitrum RPC endpoint (default: public Arbitrum One) */
  rpcUrl: string;
  /** Arbitrum Sepolia RPC endpoint */
  sepoliaRpcUrl: string;
  /** EIP-8004 Oracle API endpoint for agent identity */
  oracleEndpoint: string;
  /** EIP-8004 Identity Registry contract address */
  registryAddress: string;
  /** Default chain to use: "arbitrum" | "arbitrum-sepolia" */
  defaultChain: "arbitrum" | "arbitrum-sepolia";
  /** Private key for signing transactions (optional, for write operations) */
  privateKey?: string;
  /** ChainRails API key for cross-chain transactions (optional) */
  chainrailsApiKey?: string;
}

const DEFAULTS: PluginConfig = {
  enabled: true,
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  sepoliaRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  oracleEndpoint: "https://oracle.x402endpoints.online",
  registryAddress: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  defaultChain: "arbitrum",
};

export function resolvePluginConfig(partial: Partial<PluginConfig>): PluginConfig {
  return {
    ...DEFAULTS,
    ...partial,
  };
}

export interface ConfigValidation {
  valid: boolean;
  errors: string[];
}

export function validateConfig(config: PluginConfig): ConfigValidation {
  const errors: string[] = [];

  if (!config.rpcUrl && config.defaultChain === "arbitrum") {
    errors.push("rpcUrl is required when defaultChain is arbitrum");
  }
  if (!config.sepoliaRpcUrl && config.defaultChain === "arbitrum-sepolia") {
    errors.push("sepoliaRpcUrl is required when defaultChain is arbitrum-sepolia");
  }
  if (!config.registryAddress) {
    errors.push("registryAddress is required");
  }

  return { valid: errors.length === 0, errors };
}
