# ArbiLink — Arbitrum Agent Skill

## Overview

**ArbiLink** is an OpenClaw plugin that gives AI agents full read access to the Arbitrum ecosystem. It exposes 9 tools that let agents query wallets, tokens, gas prices, blocks, transactions, smart contracts, and the EIP-8004 Agent Identity Registry — all on Arbitrum One and Arbitrum Sepolia.

## What It Does

ArbiLink enables an AI agent to:

- **Check ETH balances** on Arbitrum One or Sepolia
- **Query ERC-20 token balances** (symbol, decimals, formatted balance)
- **Read gas prices** and current block numbers
- **Inspect blocks** (timestamp, tx count, gas used)
- **Look up transactions** by hash
- **Read any smart contract** via arbitrary ABI calls
- **Verify agent identity** via the EIP-8004 registry oracle
- **Discover registered agents** across chains
- **Get registry statistics** (total agents, per-chain breakdown)

## Architecture

```
┌──────────────────────────────────────────────┐
│              OpenClaw Gateway                 │
│  ┌────────────────────────────────────────┐  │
│  │         ArbiLink Plugin                │  │
│  │                                        │  │
│  │  ┌──────────┐  ┌───────────────────┐  │  │
│  │  │  9 AI    │  │  CLI Commands     │  │  │
│  │  │  Tools   │  │  (arbilink ...)   │  │  │
│  │  └────┬─────┘  └───────┬───────────┘  │  │
│  │       │                │              │  │
│  │  ┌────▼────────────────▼───────────┐  │  │
│  │  │          src/utils.ts           │  │  │
│  │  │   viem clients + oracle API     │  │  │
│  │  └────┬────────────────┬───────────┘  │  │
│  └───────┼────────────────┼──────────────┘  │
└──────────┼────────────────┼──────────────────┘
           │                │
    ┌──────▼──────┐  ┌──────▼──────────┐
    │  Arbitrum   │  │  EIP-8004       │
    │  RPC Nodes  │  │  Oracle API     │
    │  (One/Sep)  │  │  (x402endpoints)│
    └─────────────┘  └────────────────┘
```

## Tools Registered

| Tool Name | Description |
|---|---|
| `arbilink_balance` | Get ETH balance on Arbitrum |
| `arbilink_token_balance` | Get ERC-20 token balance |
| `arbilink_gas` | Current gas price + block number |
| `arbilink_block` | Block details (latest or by number) |
| `arbilink_tx` | Transaction lookup by hash |
| `arbilink_read_contract` | Read any smart contract function |
| `arbilink_agent_check` | Verify EIP-8004 agent registration |
| `arbilink_registry_stats` | EIP-8004 registry statistics |
| `arbilink_discover_agents` | Discover registered agents |

## Configuration

```json
{
  "plugins": {
    "allow": ["arbilink"],
    "entries": {
      "arbilink": {
        "config": {
          "enabled": true,
          "rpcUrl": "https://arb1.arbitrum.io/rpc",
          "sepoliaRpcUrl": "https://sepolia-rollup.arbitrum.io/rpc",
          "defaultChain": "arbitrum",
          "oracleEndpoint": "https://oracle.x402endpoints.online",
          "registryAddress": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        }
      }
    }
  }
}
```

## Use Cases

### 1. Portfolio Agent
An AI agent that monitors wallet balances across Arbitrum tokens and reports changes.

### 2. DeFi Research Agent
An agent that reads contract state from protocols like GMX, Camelot, or Uniswap on Arbitrum to provide real-time analytics.

### 3. Agent Identity Verification
Before interacting with another agent, verify it's registered in the EIP-8004 identity registry for trustless agent-to-agent communication.

### 4. Gas Monitoring
An agent that tracks Arbitrum gas prices and advises on optimal transaction timing.

## Tech Stack

- **Runtime**: OpenClaw plugin SDK
- **Chain interaction**: [viem](https://viem.sh) — type-safe Ethereum client
- **Chains**: Arbitrum One (42161), Arbitrum Sepolia (421614)
- **Agent identity**: EIP-8004 Oracle API
- **Registry contract**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

## Installation

```bash
openclaw plugins install @arbilink/arbitrum-agent-plugin
```

Or manually:

```bash
cp -R arbilink ~/.openclaw/extensions/
cd ~/.openclaw/extensions/arbilink && npm install
```

## CLI Usage

```bash
openclaw arbilink balance 0x1234...
openclaw arbilink token-balance 0xWallet 0xToken --chain arbitrum-sepolia
openclaw arbilink gas
openclaw arbilink block
openclaw arbilink tx 0xHash
openclaw arbilink agent-check 0xAddress
openclaw arbilink registry-stats
```

## License

MIT
