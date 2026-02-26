import type { Command } from "commander";
import type { PluginConfig } from "./config.js";
import { fetchDiscoveryResources, formatDiscoveryResources } from "./utils.js";

type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export function registerX402Cli(params: { program: Command; config: PluginConfig; logger: Logger }) {
  const { program, config, logger } = params;

  // Create the root command
  const root = program
    .command("x402")
    .description("X402 discovery utilities")
    .addHelpText("after", () => `\nX402 Discovery Plugin\n`);

  // Add the discover command
  root
    .command("discover")
    .description("Discover X402 resources")
    .action(async () => {
      try {
        logger.info("[x402] Executing discover command from CLI");
        console.log("Fetching X402 discovery resources...");

        // Fetch discovery resources
        const resources = await fetchDiscoveryResources(config.apiEndpoint);

        // Format the resources
        const formattedResources = formatDiscoveryResources(resources);

        // Output the result
        console.log(formattedResources);
        console.log("Discovery complete!");
      } catch (error) {
        console.error(`Error executing discover command: ${error instanceof Error ? error.message : String(error)}`);
        console.error("Command failed");
      }
    });
}
