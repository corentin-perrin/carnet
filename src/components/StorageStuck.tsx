import { IconDatabaseOff, IconRefresh } from '@tabler/icons-react'

/** Affiché à la place des écrans quand IndexedDB ne répond plus : sans ça, l'appli paraît vide. */
export function StorageStuck({ reason }: { reason: string }) {
  return (
    <section className="stuck">
      <span className="stuck-icon">
        <IconDatabaseOff size={28} stroke={1.75} />
      </span>
      <h1>Le stockage ne répond pas</h1>
      <p>
        Tes données ne sont probablement pas perdues : Chrome n'arrive plus à y accéder. Ça se débloque en redémarrant
        complètement Chrome.
      </p>
      <ol>
        <li>Ferme les onglets Chrome ouverts sur ce site, s'il y en a.</li>
        <li>
          Paramètres du téléphone → Applications → Chrome → <strong>Forcer l'arrêt</strong>.
        </li>
        <li>Rouvre Carnet depuis son icône.</li>
      </ol>
      <button className="btn btn-primary" onClick={() => location.reload()}>
        <IconRefresh size={18} /> Réessayer
      </button>
      <p className="stuck-detail">{reason}</p>
    </section>
  )
}
