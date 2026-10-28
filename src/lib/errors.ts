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

/** Message lisible pour une erreur d'enregistrement, avec le nom technique pour le diagnostic. */
export function describeError(err: unknown): string {
  const e = rootCause(err)
  const name = e.name ?? 'Erreur'
  if (name === 'QuotaExceededError') {
    return "Le téléphone manque de place, Chrome refuse d'enregistrer. Libère de l'espace puis réessaie."
  }
  if (['DatabaseClosedError', 'OpenFailedError', 'InvalidStateError', 'UnknownError', 'MissingAPIError'].includes(name)) {
    return `Le stockage du navigateur ne répond pas (${name}). Ferme complètement l'appli et rouvre-la.`
  }
  return `Enregistrement impossible (${name}${e.message ? ` : ${e.message}` : ''}).`
}
