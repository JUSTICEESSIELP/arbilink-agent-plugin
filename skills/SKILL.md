# X402 Discovery Plugin Skills

This document outlines the skills and capabilities provided by the X402 Discovery Plugin for OpenClaw.

## Discovery Skills

### Discover X402 Resources

**Skill Name**: `x402_discover`

**Description**: Fetches and displays X402 discovery resources from the configured API endpoint.

**Usage**:

```
x402_discover
```

**Parameters**:

- `command` (optional): Command to execute (default is "discover")

**Returns**:

- Formatted list of X402 resources with details including:
  - Resource URL
  - Resource type
  - Last updated timestamp
  - Description
  - Network information
  - MIME type
  - Scheme
  - Timeout settings
  - Payment information

**Example Output**:

```
## X402 Discovery Resources

### Resource 1
- **URL**: https://public.zapper.xyz/x402/defi-balances
- **Type**: http
- **Last Updated**: 2/24/2026, 10:04:54 AM
- **Description**: Get DeFi balances (Liquidity Pools, Yield Farming, Lending, etc.) for a single address, or a list of addresses.

  **Network**: base
  **MIME Type**: application/json
  **Scheme**: exact
  **Max Timeout**: 10 seconds
  **Max Amount Required**: 1100
  **Pay To**: 0x43a2a720cd0911690c248075f4a29a5e7716f758
```

## CLI Commands

### Discover Command

**Command**: `openclaw x402 discover`

**Description**: CLI command to fetch and display X402 discovery resources.

**Usage**:

```bash
openclaw x402 discover
```

**Options**:

- None currently available

## Gateway Methods

### x402.discover

**Method**: `x402.discover`

**Description**: Gateway method for programmatic access to X402 discovery resources.

**Usage**:

```javascript
// Example client code
const response = await gateway.request("x402.discover", {});
console.log(response);
```

**CLI Usage**:

```bash
openclaw gateway call x402.discover
```

**Parameters**:

- None required

**Returns**:

- JSON object containing:
  - `success`: Boolean indicating success status
  - `result`: Formatted string of discovery resources
  - `timestamp`: ISO timestamp of when the request was processed

## Integration with AI

The X402 Discovery Plugin registers a tool that can be used by AI assistants to discover X402 resources. This allows AI to fetch and display resource information when needed during conversations.

**Tool Name**: `x402_discover`

**Tool Description**: Discover X402 resources from the API.

**Parameters**:

- `command`: String (optional) - Command to execute

## Configuration

The plugin requires the following configuration:

```json
{
  "enabled": true,
  "apiEndpoint": "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"
}
```

- `enabled`: Boolean to enable/disable the plugin
- `apiEndpoint`: String URL of the X402 discovery API endpoint
