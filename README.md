# ArbiLink — Arbitrum Agent Plugin for OpenClaw

An OpenClaw plugin that enables AI agents to interact with the Arbitrum ecosystem. Built for the [ArbiLink Agentic Bounty](https://www.notion.so/33390457c3268053ac0ac5c904c13a3e).

## Features

- **9 AI-accessible tools** for Arbitrum chain interaction
- **ETH & ERC-20 balances** on Arbitrum One and Sepolia
- **Gas prices**, block info, and transaction lookups
- **Arbitrary smart contract reads** via ABI
- **EIP-8004 Agent Identity** verification and discovery
- **CLI commands** for all operations
- **Gateway RPC methods** for programmatic access

## Quick Start

### Install

```bash
openclaw plugins install @arbilink/arbitrum-agent-plugin
```

### Configure

Add to your OpenClaw config:

```json
{
  "plugins": {
    "allow": ["arbilink"],
    "entries": {
      "arbilink": {
        "config": {
          "enabled": true,
          "defaultChain": "arbitrum"
        }
      }
    }
  }
}
```

### Use

The plugin registers 9 tools automatically available to AI agents:

| Tool | What it does |
|---|---|
| `arbilink_balance` | ETH balance lookup |
| `arbilink_token_balance` | ERC-20 token balance |
| `arbilink_gas` | Current gas price |
| `arbilink_block` | Block information |
| `arbilink_tx` | Transaction lookup |
| `arbilink_read_contract` | Read any contract |
| `arbilink_agent_check` | EIP-8004 agent verification |
| `arbilink_registry_stats` | Registry statistics |
| `arbilink_discover_agents` | Discover registered agents |

### CLI

```bash
openclaw arbilink balance 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
openclaw arbilink gas --chain arbitrum-sepolia
openclaw arbilink agent-check 0x1234...
```

### Gateway RPC

```bash
openclaw gateway call arbilink.balance '{"address": "0x..."}'
openclaw gateway call arbilink.gas
openclaw gateway call arbilink.agent-check '{"address": "0x..."}'
```

## EIP-8004 Integration

This plugin integrates with the [EIP-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004) standard via the public oracle at `oracle.x402endpoints.online`. Agents can verify each other's on-chain identity before interacting — enabling trustless agent-to-agent communication on Arbitrum.

**Registry contract**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

## Tech Stack

- [OpenClaw](https://openclaw.com) plugin SDK
- [viem](https://viem.sh) for type-safe chain interaction
- Arbitrum One (chain 42161) + Arbitrum Sepolia (chain 421614)
- EIP-8004 Oracle API

## Documentation

See [SKILL.md](./SKILL.md) for detailed skill documentation, architecture diagram, and use cases.

## License

MIT
