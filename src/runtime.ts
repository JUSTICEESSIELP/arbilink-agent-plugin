/**
 * Plugin runtime state management.
 */

let _pluginRuntime: any = null;

export function setPluginRuntime(runtime: any): void {
  _pluginRuntime = runtime;
}

export function getPluginRuntime(): any {
  if (!_pluginRuntime) {
    throw new Error("[arbilink] Plugin runtime not initialized");
  }
  return _pluginRuntime;
}
