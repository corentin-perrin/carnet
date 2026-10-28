import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'

interface Props {
  title: string
  onClose: () => void
  /** Reçoit `close`, qui ferme le panneau en passant par l'historique. */
  children: (close: () => void) => ReactNode
}

/**
 * Panneau qui monte du bas de l'écran.
 * Il ajoute une entrée d'historique pour que le geste « retour » d'Android le ferme au lieu de quitter l'appli.
 */
export function Sheet({ title, onClose, children }: Props) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    history.pushState({ sheet: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const close = () => history.back()

  return createPortal(
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Fermer">
            <IconX size={20} />
          </button>
        </header>
        <div className="sheet-body">{children(close)}</div>
      </div>
    </div>,
    document.body,
  )
}
