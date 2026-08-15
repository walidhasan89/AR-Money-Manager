import { useEffect, useState } from 'react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { getAppVersion } from '../lib/ipc/commands'

const AUTHOR_URL = 'https://walidhasan.com'

/**
 * Opens via the opener plugin (not a plain `<a href>`) so the link launches
 * the OS's default browser instead of navigating this app's own locked-down
 * WebView away from itself (docs: "No remote content in the WebView").
 */
export function SidebarFooter() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    getAppVersion()
      .then(setVersion)
      .catch(() => setVersion(null))
  }, [])

  return (
    <div className="text-text-secondary flex flex-col gap-0.5 text-xs">
      <span>
        ©{' '}
        <button
          type="button"
          onClick={() => openUrl(AUTHOR_URL)}
          className="hover:text-text-primary underline-offset-2 hover:underline"
        >
          Walid Hasan
        </button>
      </span>
      {version && <span className="tabular-nums">Version: {version}</span>}
    </div>
  )
}
