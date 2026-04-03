# ArbiLink — Arbitrum Agent Plugin for OpenClaw

An OpenClaw plugin that enables AI agents to interact with the Arbitrum ecosystem and perform cross-chain transactions. Built for the [ArbiLink Agentic Bounty](https://www.notion.so/33390457c3268053ac0ac5c904c13a3e).

## Features

- **16 AI-accessible tools** for Arbitrum and cross-chain interaction
- **ETH & ERC-20 balances** on Arbitrum One and Sepolia
- **Gas prices**, block info, and transaction lookups
- **Arbitrary smart contract reads** via ABI
- **EIP-8004 Agent Identity** verification and discovery
- **Cross-chain payments** via [ChainRails](https://docs.chainrails.io) — quotes, routes, bridges, and payment intents
- **Multi-chain support** — Arbitrum, Ethereum, Base, Polygon, BSC, Avalanche, Optimism, Starknet, and more
- **CLI commands** and **Gateway RPC methods** for all operations

## Getting Started

### What You Need

**Nothing** — the 9 Arbitrum tools work out of the box with zero configuration. They use public RPCs and the free EIP-8004 oracle API.

To unlock the 7 cross-chain tools, you need a [ChainRails API key](https://docs.chainrails.io) (set `chainrailsApiKey` in config).

No private keys or wallet setup required. The plugin is **read-only + intent-based** — it reads on-chain data and creates payment intents (like invoices) that a user's wallet then fulfills.

### Install

```bash
openclaw plugins install arbilink
```

### Configure

**Minimal (Arbitrum-only, no API key needed):**

```json
{
  "plugins": {
    "allow": ["arbilink"],
    "entries": {
      "arbilink": {
        "config": {
          "enabled": true
        }
      }
    }
  }
}
```

**Full (with cross-chain tools):**

```json
{
  "plugins": {
    "allow": ["arbilink"],
    "entries": {
      "arbilink": {
        "config": {
          "enabled": true,
          "defaultChain": "arbitrum",
          "chainrailsApiKey": "cr_live_your_key_here"
        }
      }
    }
  }
}
```

### All Configuration Options

| Option | Required | Default | Description |
|---|---|---|---|
| `enabled` | No | `true` | Enable/disable the plugin |
| `defaultChain` | No | `"arbitrum"` | `"arbitrum"` or `"arbitrum-sepolia"` |
| `rpcUrl` | No | Public Arbitrum RPC | Custom RPC for Arbitrum One |
| `sepoliaRpcUrl` | No | Public Sepolia RPC | Custom RPC for Arbitrum Sepolia |
| `oracleEndpoint` | No | `oracle.x402endpoints.online` | EIP-8004 oracle API |
| `registryAddress` | No | `0x8004A...` | EIP-8004 registry contract |
| `chainrailsApiKey` | No | — | ChainRails API key for cross-chain tools |

## Tools

### Arbitrum Tools (always available)

| Tool | What it does |
|---|---|
| `arbilink_balance` | Get ETH balance on Arbitrum |
| `arbilink_token_balance` | Get ERC-20 token balance |
| `arbilink_gas` | Current gas price + block number |
| `arbilink_block` | Block details (latest or by number) |
| `arbilink_tx` | Transaction lookup by hash |
| `arbilink_read_contract` | Read any smart contract function |
| `arbilink_agent_check` | Verify EIP-8004 agent registration |
| `arbilink_registry_stats` | Registry statistics |
| `arbilink_discover_agents` | Discover registered agents |

### Cross-Chain Tools (requires `chainrailsApiKey`)

| Tool | What it does |
|---|---|
| `arbilink_supported_chains` | List all supported networks |
| `arbilink_cross_chain_balance` | Balances across all chains at once |
| `arbilink_cross_chain_quote` | Best quote for a cross-chain transfer |
| `arbilink_find_routes` | Optimal bridge route with fees |
| `arbilink_supported_bridges` | Available bridges between two chains |
| `arbilink_create_intent` | Create a cross-chain payment intent |
| `arbilink_intent_status` | Track payment status |

### Supported Chains (Cross-Chain)

Arbitrum, Ethereum, Base, Polygon, BSC, Avalanche, Optimism, Starknet, Lisk, HyperEVM, Monad — plus testnets for Arbitrum, Ethereum, Base, Avalanche, Optimism, Starknet, and Monad.

## Example Use Cases

### 1. Portfolio Agent
> "What's my ETH balance on Arbitrum and token balance for USDC?"

Uses `arbilink_balance` and `arbilink_token_balance`.

### 2. Cross-Chain Payment Agent
> "Get me a quote to send 100 USDC from Ethereum to Arbitrum"

Uses `arbilink_cross_chain_quote` to find the cheapest bridge, then `arbilink_create_intent` to create the payment.

### 3. DeFi Research Agent
> "Read the totalSupply from this contract on Arbitrum"

Uses `arbilink_read_contract` with any ABI signature.

### 4. Agent Identity Verification
> "Is this address a registered AI agent?"

Uses `arbilink_agent_check` to verify EIP-8004 registration.

### 5. Gas Monitor
> "What's the current gas price on Arbitrum?"

Uses `arbilink_gas` for real-time gas data.

## CLI

```bash
openclaw arbilink balance 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
openclaw arbilink gas --chain arbitrum-sepolia
openclaw arbilink token-balance 0xWallet 0xToken
openclaw arbilink tx 0xHash
openclaw arbilink agent-check 0xAddress
openclaw arbilink registry-stats
```

## Gateway RPC

```bash
openclaw gateway call arbilink.balance '{"address": "0x..."}'
openclaw gateway call arbilink.gas
openclaw gateway call arbilink.agent-check '{"address": "0x..."}'
```

## EIP-8004 Integration

Integrates with [EIP-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004) via the public oracle. Agents can verify each other's on-chain identity before interacting — enabling trustless agent-to-agent communication.

- **Arbitrum One Registry**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **Arbitrum Sepolia Registry**: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- **Agent ID**: `421614:178`

## Tech Stack

- [OpenClaw](https://openclaw.com) plugin SDK
- [viem](https://viem.sh) — type-safe Ethereum client
- [@chainrails/sdk](https://docs.chainrails.io) — cross-chain payments and routing
- [agent0-sdk](https://github.com/agent0lab/agent0-ts) — EIP-8004 agent registration
- Arbitrum One (42161) + Arbitrum Sepolia (421614)
- EIP-8004 Oracle API

## Documentation

See [SKILL.md](./SKILL.md) for detailed skill documentation and architecture diagram.

## License

MIT
