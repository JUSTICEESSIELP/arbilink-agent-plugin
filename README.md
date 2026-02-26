# X402 Discovery Plugin

A simple OpenClaw plugin that fetches and displays X402 discovery resources.

## Features

- Fetches resources from the X402 discovery API
- Formats and displays the resources in a readable format
- Provides a CLI command `x402 discover` to access resources
- Registers an AI tool for discovery operations

## Installation

### Option A: Install via OpenClaw (recommended)

```bash
openclaw plugins install @openclaw/x402
```

Restart the Gateway afterwards.

### Option B: Copy into your global extensions folder (dev)

On your VPS:

```bash
mkdir -p ~/.openclaw/extensions
mkdir -p ~/plugins/
```

On your Local Machine:

```bash
scp -r "D:\DigitalBenjamins\openclaw-plugin\x402\" trader@46.225.134.170:~/plugins/
```

On your VPS:

```bash
cp -R ~/plugins/x402 ~/.openclaw/extensions/
cd ~/.openclaw/extensions/x402 && npm install
```

## Configuration

Add the following configuration to your OpenClaw config file (typically `~/.openclaw/config.json` or similar):

```json
{
  "plugins": {
    "allow": ["x402"],
    "entries": {
      "x402": {
        "config": {
          "enabled": true,
          "apiEndpoint": "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"
        }
      }
    }
  }
}
```

Alternatively, you can configure the plugin through the OpenClaw UI if available.

## Usage

### CLI Command

Run the discover command to fetch and display X402 resources:

```bash
openclaw x402 discover
```

### Gateway RPC

Call the plugin's gateway method:

```javascript
// Example client code
const response = await gateway.request("x402.discover", {});
console.log(response);
```

```
openclaw gateway call x402.discover
```

### AI Tool

The plugin registers a tool that can be used by the AI:

```
Tool name: x402_discover
Parameters:
- command: String (optional) - Command to execute
```

## License

MIT
