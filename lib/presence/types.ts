/**
 * Tipos compartidos del sistema de presencia en tiempo real.
 *
 * Un "grupo" (equipo) reporta periódicamente en qué vista está trabajando.
 * El backoffice lee ese estado y lo agrupa por ubicación.
 */

/** Identificadores canónicos de ubicación (las 5 vistas + estados auxiliares). */
export type LocationId =
  | "ami"
  | "ceo"
  | "cidi"
  | "hmp"
  | "lum"
  | "plano"
  | "lobby"
  | "otro"

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
  { id: "plano", label: "Plano", color: "var(--neon-cyan)" },
  { id: "lobby", label: "Registro / Lobby", color: "var(--neon-blue)" },
  { id: "otro", label: "Otro", color: "var(--neon-pink)" },
]

/** Convierte una ruta (`usePathname`) a una ubicación canónica. */
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
    case "/plano":
      return "plano"
    case "/":
      return "lobby"
    default:
      return "otro"
  }
}

/** Ventana de vida de un grupo sin heartbeat antes de considerarlo desconectado. */
export const PRESENCE_TTL_MS = 15_000
/** Cada cuánto el cliente reenvía su heartbeat. */
export const HEARTBEAT_INTERVAL_MS = 5_000
