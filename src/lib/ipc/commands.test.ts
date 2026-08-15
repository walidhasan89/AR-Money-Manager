import { describe, expect, it, vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue('0.1.0'),
}))

import { invoke } from '@tauri-apps/api/core'
import { getAppVersion } from './commands'

describe('getAppVersion', () => {
  it('invokes the get_app_version command and returns its result', async () => {
    await expect(getAppVersion()).resolves.toBe('0.1.0')
    expect(invoke).toHaveBeenCalledWith('get_app_version')
  })
})
