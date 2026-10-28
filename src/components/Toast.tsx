import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ToastAction {
  label: string
  run: () => void
}
interface ToastState {
  id: number
  message: string
  action?: ToastAction
}
type ShowToast = (message: string, action?: ToastAction) => void

const ToastContext = createContext<ShowToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback<ShowToast>((message, action) => {
    const id = Date.now()
    setToast({ id, message, action })
    setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), action ? 5000 : 2500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="toast" key={toast.id} role="status">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.run()
                setToast(null)
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
