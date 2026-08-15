import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error'
}

interface ToastState {
  toasts: Toast[]
  showToast: (message: string, variant?: Toast['variant']) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, variant = 'success') => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }))
    if (variant === 'success') {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, 2500)
    }
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
