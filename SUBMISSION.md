# ArbiLink — Agentic Bounty Submission

## Project

- **Name**: ArbiLink — Arbitrum Agent Plugin
- **Description**: OpenClaw plugin enabling AI agents to interact with Arbitrum — balances, gas, tokens, smart contract reads, and EIP-8004 agent identity verification.
- **GitHub**: https://github.com/JUSTICEESSIELP/arbilink-agent-plugin
- **ClawHub**: `arbilink@1.0.0` — https://clawhub.ai/plugins/arbilink

## Agent Registration (EIP-8004)

- **Agent ID**: `421614:178`
- **Chain**: Arbitrum Sepolia (421614)
- **Registry Contract**: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- **Tx Hash**: `0x91481bb8d0eb380e7e7b47e9be93e4ab4ee392cb4fd3a610d2cd7a8ae271ea6e`
- **Explorer**: https://sepolia.arbiscan.io/tx/0x91481bb8d0eb380e7e7b47e9be93e4ab4ee392cb4fd3a610d2cd7a8ae271ea6e
- **Method**: Official agent0 SDK (`agent0-sdk`) with `registryOverrides` for Arbitrum chain support
- **Registration Type**: Fully on-chain (data URI, no IPFS)

## Tools Registered (9 total)

| Tool | Description |
|---|---|
| `arbilink_balance` | Get ETH balance on Arbitrum One or Sepolia |
| `arbilink_token_balance` | Get ERC-20 token balance (symbol, decimals, formatted) |
| `arbilink_gas` | Current gas price + latest block number |
| `arbilink_block` | Block details (timestamp, tx count, gas used) |
| `arbilink_tx` | Transaction lookup by hash |
| `arbilink_read_contract` | Read any smart contract via arbitrary ABI |
| `arbilink_agent_check` | Verify EIP-8004 agent registration via oracle |
| `arbilink_registry_stats` | EIP-8004 registry statistics |
| `arbilink_discover_agents` | Discover registered agents across chains |

## Tech Stack

- **Runtime**: OpenClaw plugin SDK
- **Chain interaction**: viem (type-safe Ethereum client)
- **Agent registration**: agent0-sdk (official EIP-8004 SDK)
- **Chains**: Arbitrum One (42161), Arbitrum Sepolia (421614)
- **Agent identity**: EIP-8004 Oracle API (`oracle.x402endpoints.online`)
- **Registry contract**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (One) / `0x8004A818BFB912233c491871b3d84c89A494BD9e` (Sepolia)

## Submission Date

April 3, 2026
