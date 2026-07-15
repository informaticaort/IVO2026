/**
 * Tipos compartidos del sistema de presencia en tiempo real.
 *
 * Un "grupo" (equipo) reporta periódicamente en qué vista está trabajando.
 * El backoffice lee ese estado y lo agrupa por ubicación.
 */

/** Identificadores canónicos de ubicación (las 5 vistas + el lobby). */
export type LocationId =
  | "ami"
  | "ceo"
  | "cidi"
  | "hmp"
  | "lum"
  | "lobby"

/** Los 5 juegos de la sala (subconjunto de `LocationId`). */
export type GameId = "cidi" | "ami" | "hmp" | "ceo" | "lum"

/**
 * Orden canónico de los 5 juegos. Se usa tanto para pintar la barra de progreso
 * del backoffice como para leer/validar los juegos que cada grupo completó.
 */
export const GAME_IDS: GameId[] = ["cidi", "ami", "hmp", "ceo", "lum"]

/**
 * Prefijo de la clave de `localStorage` con la que `LabConversation` marca un
 * juego como resuelto (una clave por juego). Es la fuente de verdad del
 * progreso: el cliente la lee en cada heartbeat y la reporta al backoffice.
 */
export const DONE_KEY_PREFIX = "escape-room-done-"

/** Clave de `localStorage` que marca un juego como resuelto (p. ej. `...-AMI`). */
export function doneStorageKey(gameId: GameId): string {
  return `${DONE_KEY_PREFIX}${gameId.toUpperCase()}`
}

/** Estado de un grupo en un instante dado. */
export type GroupPresence = {
  /** Id único y estable del grupo (persistido en sessionStorage del cliente). */
  grupoId: string
  /** Nombre visible del equipo (elegido en el registro). */
  name: string
  /** Ubicación canónica actual. */
  location: LocationId
  /** Ruta cruda del navegador, útil para debug. */
  path: string
  /** Epoch (ms) en que el grupo entró a la ubicación actual. */
  since: number
  /** Epoch (ms) del último heartbeat recibido. */
  lastSeen: number
  /**
   * Juegos que el grupo ya resolvió, en orden canónico. Lo reporta el cliente
   * leyendo `localStorage` en cada heartbeat, así el backoffice puede mostrar
   * qué juegos completó cada grupo y cuáles quedan pendientes.
   */
  completed: GameId[]
}

/** Metadatos de cada ubicación para pintar el panel. */
export type LocationMeta = {
  id: LocationId
  label: string
  /** Color de acento (mismo criterio que el plano). */
  color: string
}

/**
 * Orden y metadatos de las ubicaciones que muestra el backoffice.
 * Los colores replican los de `LAB_COLORS` del plano para mantener coherencia.
 */
export const LOCATIONS: LocationMeta[] = [
  { id: "cidi", label: "CIDI", color: "var(--neon-green)" },
  { id: "ami", label: "AMI", color: "oklch(0.9 0.19 100)" },
  { id: "hmp", label: "HMP", color: "oklch(0.62 0.25 300)" },
  { id: "ceo", label: "CEO", color: "oklch(0.98 0.01 240)" },
  { id: "lum", label: "LUM", color: "var(--neon-red)" },
  { id: "lobby", label: "Lobby", color: "var(--neon-blue)" },
]

/**
 * Convierte una ruta (`usePathname`) a una ubicación canónica. Cualquier vista
 * que no sea uno de los 5 juegos (plano, registro, rutas sueltas) cae en el
 * "lobby": el único grupo auxiliar que muestra el backoffice.
 */
export function pathToLocation(pathname: string): LocationId {
  switch (pathname) {
    case "/ami-game":
      return "ami"
    case "/ceo-game":
      return "ceo"
    case "/cidi-game":
      return "cidi"
    case "/hmp-game":
      return "hmp"
    case "/lum-game":
      return "lum"
    default:
      return "lobby"
  }
}

/** Ventana de vida de un grupo sin heartbeat antes de considerarlo desconectado. */
export const PRESENCE_TTL_MS = 15_000
/** Cada cuánto el cliente reenvía su heartbeat. */
export const HEARTBEAT_INTERVAL_MS = 5_000
