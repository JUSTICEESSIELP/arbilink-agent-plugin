import { Type } from "@sinclair/typebox";
import type { GatewayRequestHandlerOptions, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { resolvePluginConfig, validateConfig, type PluginConfig } from "./src/config.js";
import { formatError, fetchDiscoveryResources, formatDiscoveryResources } from "./src/utils.js";
import { registerX402Cli } from "./src/cli.js";
import { getPluginRuntime, setPluginRuntime } from "./src/runtime.js";

// Define the configuration schema for the plugin UI
const pluginConfigSchema = {
  parse(value: PluginConfig): PluginConfig {
    return resolvePluginConfig(value);
  },
  uiHints: {
    enabled: {
      label: "Enable Plugin",
      help: "Toggle to enable or disable this plugin",
    },
    apiEndpoint: {
      label: "API Endpoint",
      help: "The endpoint to fetch discovery resources from",
    },
  },
};

// Define the schema for the discover command
const DiscoverCommandSchema = Type.Object({
  command: Type.Optional(Type.String({ description: "Command to execute" })),
});

// Main plugin definition
const x402Plugin = {
  id: "x402",
  name: "x402 OpenClaw Plugin",
  description: "A plugin to fetch discovery resources from a specified API endpoint.",
  configSchema: pluginConfigSchema,
  register(api: OpenClawPluginApi) {
    setPluginRuntime(api.runtime);

    // Parse the plugin configuration
    const config = pluginConfigSchema.parse(api.pluginConfig);

    // Validate the configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      api.logger.warn(`[x402] Configuration validation failed: ${validation.errors.join("; ")}`);
    }

    // Skip registration if the plugin is disabled
    if (!config.enabled) {
      api.logger.info("[x402] Plugin is disabled, skipping registration");
      return;
    }

    // Log plugin initialization
    api.logger.info("[x402] Initializing plugin");
    if (api.logger.debug) {
      api.logger.debug(`[x402] Configuration: ${JSON.stringify(config)}`);
    }

    // Register a gateway method for the discover command
    api.registerGatewayMethod("x402.discover", async ({ params, respond }: GatewayRequestHandlerOptions) => {
      try {
        api.logger.info("[x402] Executing discover command");

        // Fetch discovery resources
        const resources = await fetchDiscoveryResources(config.apiEndpoint);

        // Format the resources
        const formattedResources = formatDiscoveryResources(resources);

        // Return the result
        respond(true, {
          success: true,
          result: formattedResources,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        respond(false, { error: formatError(err) });
      }
    });

    // Register a CLI command for discovery
    api.registerCli(
      ({ program }) =>
        registerX402Cli({
          program,
          config,
          logger: api.logger,
        }),
      { commands: ["x402"] },
    );

    // Register a tool that can be used by the AI
    api.registerTool({
      name: "x402_discover",
      label: "X402 Discover",
      description: "Discover X402 resources from the API.",
      parameters: DiscoverCommandSchema,
      async execute(_toolCallId: string, _params: any) {
        try {
          api.logger.info("[x402] Executing discover command from AI tool");

          // Fetch discovery resources
          const resources = await fetchDiscoveryResources(config.apiEndpoint);

          // Format the resources
          const formattedResources = formatDiscoveryResources(resources);

          // Return the result
          return {
            content: [
              {
                type: "text" as const,
                text: formattedResources,
              },
            ],
            details: {
              success: true,
              result: formattedResources,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text" as const,
                text: formatError(err),
              },
            ],
            details: {
              success: false,
              error: formatError(err),
            },
          };
        }
      },
    });

    // Register a service (optional)
    api.registerService({
      id: "x402-service",
      start: async () => {
        if (!config.enabled) {
          return;
        }
        api.logger.info("[x402] Service started");
      },
      stop: async () => {
        api.logger.info("[x402] Service stopped");
      },
    });

    // Register a command handler (optional)
    api.registerCommand({
      name: "x402info",
      description: "Show x402 plugin source location",
      handler: () => ({
        text: `The current source location of the x402 plugin is: ${config.apiEndpoint}. The plugin is designed to fetch discovery resources from this endpoint. You can update the endpoint in the plugin configuration if needed.`,
      }),
    });

    // Register a hook for when a message is received (optional)
    api.on("message_received", async (event, ctx) => {
      if (event.content.includes("x402")) {
        // Use the appropriate channel's send method
        const channelId = ctx.channelId;
        const from = event.from;
        // This is a generic approach that works across channels
        const sendMethod = getPluginRuntime().channel[channelId]?.[`sendMessage${channelId.charAt(0).toUpperCase() + channelId.slice(1)}`]; // api.runtime.channel.whatsapp.sendMessageWhatsApp
        if (sendMethod) {
          const responseText =
            "I detected a message mentioning x402! We have a decicated tool for that called x402_discover. Try sending '/x402info' to see the plugin source location.";
          await sendMethod(from, responseText, { accountId: ctx.accountId });
        }
      }

      // Log the received message and context for debugging
      api.logger.info(`[x402] inbound message received: ${event.content}`);
      api.logger.info(`   - Context: ${JSON.stringify(ctx)}\n`);
      api.logger.info(`   - Event: ${JSON.stringify(event)}\n`);
    });

    // api.registerHook(
    //   "message:received",
    //   async () => {
    //     api.logger.warn("[x402] Message received, running hook");
    //   },
    //   {
    //     name: "x402.message-received",
    //     description: "Runs when a message is received",
    //   },
    // );

    api.logger.info("[x402] Initializing plugin completed");
  },
};

export default x402Plugin;
