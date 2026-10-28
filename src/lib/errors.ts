interface ErrorLike {
  name?: string
  message?: string
  inner?: ErrorLike
}

/** Dexie enveloppe souvent l'erreur IndexedDB d'origine dans `inner` : on remonte jusqu'à elle. */
function rootCause(err: unknown): ErrorLike {
  let e = (err ?? {}) as ErrorLike
  while (e.inner) e = e.inner
  return e
}

const TIMEOUT_MS = 5000

/** Rejette si le stockage ne répond pas : un IndexedDB bloqué ne renvoie jamais d'erreur, il attend. */
export function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject({ name: 'Timeout', message: `pas de réponse au bout de ${TIMEOUT_MS / 1000} s` }), TIMEOUT_MS),
    ),
  ])
}

/** Message lisible pour une erreur d'enregistrement, avec le nom technique pour le diagnostic. */
export function describeError(err: unknown): string {
  const e = rootCause(err)
  const name = e.name ?? 'Erreur'
  if (name === 'QuotaExceededError') {
    return "Le téléphone manque de place, Chrome refuse d'enregistrer. Libère de l'espace puis réessaie."
  }
  if (name === 'Timeout') {
    return 'Le stockage du navigateur ne répond plus. Force l’arrêt de Chrome puis rouvre l’appli.'
  }
  if (['DatabaseClosedError', 'OpenFailedError', 'InvalidStateError', 'UnknownError', 'MissingAPIError'].includes(name)) {
    return `Le stockage du navigateur ne répond pas (${name}). Ferme complètement l'appli et rouvre-la.`
  }
  return `Enregistrement impossible (${name}${e.message ? ` : ${e.message}` : ''}).`
}
