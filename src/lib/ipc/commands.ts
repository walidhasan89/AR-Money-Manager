import { invoke } from '@tauri-apps/api/core'

/**
 * Typed wrappers around Tauri `invoke()` calls — the only way the frontend
 * talks to Rust. No raw command names or payloads outside this module.
 */
export function getAppVersion(): Promise<string> {
  return invoke<string>('get_app_version')
}
