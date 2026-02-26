import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setPluginRuntime(next: PluginRuntime) {
  runtime = next;
}

export function getPluginRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("Plugin runtime not initialized");
  }
  return runtime;
}
