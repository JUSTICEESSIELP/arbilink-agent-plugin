import { z } from "zod";

// Define the plugin configuration schema
export const PluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiEndpoint: z.string().default("https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"),
});

// Define the plugin configuration type
export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// Resolve the plugin configuration
export function resolvePluginConfig(value: PluginConfig): PluginConfig {
  const defaultConfig: PluginConfig = {
    enabled: true,
    apiEndpoint: "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources",
  };

  if (!value || typeof value !== "object") {
    return defaultConfig;
  }

  try {
    return PluginConfigSchema.parse(value);
  } catch (error) {
    console.error("Error parsing plugin config:", error);
    return defaultConfig;
  }
}

// Validate the plugin configuration
export function validateConfig(config: PluginConfig) {
  try {
    PluginConfigSchema.parse(config);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: ["Unknown validation error"],
    };
  }
}
