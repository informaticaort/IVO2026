/* -------------------------------------------------------------------------
 * CLAVE DEL PANEL /admin
 *
 * El panel de monitoreo siempre pide clave. Por defecto es la del evento;
 * definiendo `ADMIN_KEY` en `.env.local` se puede reemplazar sin tocar código.
 * Se compara ignorando mayúsculas y espacios sobrantes: el operador la tipea
 * a mano (a veces en una tablet que autocapitaliza) y no queremos rechazos
 * por una mayúscula de más.
 * ---------------------------------------------------------------------- */

/** Clave del evento, usada cuando no hay `ADMIN_KEY` definida. */
const DEFAULT_ADMIN_KEY = "LRDL"

function expectedAdminKey(): string {
  return process.env.ADMIN_KEY?.trim() || DEFAULT_ADMIN_KEY
}

/** `true` si la request trae `?key=` con la clave correcta. */
export function isAdminRequest(request: Request): boolean {
  const provided = new URL(request.url).searchParams.get("key")
  if (!provided) return false
  return provided.trim().toLowerCase() === expectedAdminKey().toLowerCase()
}
