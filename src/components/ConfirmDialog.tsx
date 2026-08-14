import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Every destructive action routes through this, naming exactly what will happen. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [shake, setShake] = useState(false)

  function handleBackdropClick() {
    setShake(true)
    setTimeout(() => setShake(false), 200)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleBackdropClick}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, x: shake ? [0, -6, 6, -4, 4, 0] : 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: shake ? 0.2 : 0.12 }}
            className="glass-card relative w-full max-w-sm p-6"
          >
            <h2 id="confirm-dialog-title" className="text-text-primary text-lg font-semibold">
              {title}
            </h2>
            <p className="text-text-secondary mt-2 text-sm">{description}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border-glass-border text-text-secondary hover:text-text-primary rounded-control border px-4 py-2 text-sm transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-control px-4 py-2 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] ${
                  danger ? 'bg-accent-danger' : 'bg-accent-primary'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
