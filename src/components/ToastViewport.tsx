import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`glass-card pointer-events-auto flex items-center gap-2 px-4 py-3 text-sm ${
              toast.variant === 'error' ? 'text-accent-danger' : 'text-accent-success'
            }`}
          >
            {toast.variant === 'error' ? (
              <XCircle size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <CheckCircle2 size={18} strokeWidth={1.75} aria-hidden />
            )}
            <span className="text-text-primary">{toast.message}</span>
            {toast.variant === 'error' && (
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
                className="text-text-secondary hover:text-text-primary ml-2"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
