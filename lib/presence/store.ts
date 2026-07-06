import { PRESENCE_TTL_MS, type GroupPresence } from "./types"

/**
 * Capa de datos de presencia — store EN MEMORIA para host local.
 *
 * El monitoreo corre en una sola máquina (un proceso Node persistente vía
 * `next start` / `next dev`), así que el estado vive en memoria del proceso.
 * Simple, sin dependencias ni infraestructura externa, sin internet.
 *
 * Cada grupo tiene un vencimiento (TTL): si el navegador deja de mandar
 * heartbeats, el grupo se descarta en la próxima lectura (limpieza perezosa),
 * así no quedan "usuarios fantasma". La baja explícita (`leave`, vía
 * `sendBeacon` al cerrar la pestaña) lo saca al instante.
 *
 * Nota: esto asume UN solo proceso (el caso del evento local). No sirve para un
 * despliegue serverless con múltiples instancias, donde no se comparte memoria.
 */

// La foto se sube una sola vez y dura todo el evento (no se refresca en cada
// heartbeat, para no reenviarla).
const AVATAR_TTL_MS = 6 * 60 * 60 * 1000

type MemoryEntry = { presence: GroupPresence; expiresAt: number }
type AvatarEntry = { dataUrl: string; expiresAt: number }

// Los singletons se cuelgan de globalThis para sobrevivir al HMR de `next dev`
// y garantizar una única instancia compartida por todas las API routes.
const globalForStore = globalThis as unknown as {
  __presenceMemory?: Map<string, MemoryEntry>
  __presenceAvatars?: Map<string, AvatarEntry>
}

class MemoryStore {
  private get map(): Map<string, MemoryEntry> {
    if (!globalForStore.__presenceMemory) {
      globalForStore.__presenceMemory = new Map()
    }
    return globalForStore.__presenceMemory
  }

  private get avatars(): Map<string, AvatarEntry> {
    if (!globalForStore.__presenceAvatars) {
      globalForStore.__presenceAvatars = new Map()
    }
    return globalForStore.__presenceAvatars
  }

  async report(p: GroupPresence): Promise<void> {
    this.map.set(p.grupoId, { presence: p, expiresAt: Date.now() + PRESENCE_TTL_MS })
  }

  async leave(grupoId: string): Promise<void> {
    this.map.delete(grupoId)
  }

  async list(): Promise<GroupPresence[]> {
    const now = Date.now()
    const alive: GroupPresence[] = []
    for (const [id, entry] of this.map) {
      if (entry.expiresAt <= now) {
        this.map.delete(id) // limpieza perezosa de expirados (fantasmas)
        continue
      }
      alive.push(entry.presence)
    }
    return alive
  }

  async setAvatar(grupoId: string, dataUrl: string): Promise<void> {
    this.avatars.set(grupoId, { dataUrl, expiresAt: Date.now() + AVATAR_TTL_MS })
  }

  async getAvatar(grupoId: string): Promise<string | null> {
    const entry = this.avatars.get(grupoId)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.avatars.delete(grupoId)
      return null
    }
    return entry.dataUrl
  }
}

const globalForInstance = globalThis as unknown as { __presenceStore?: MemoryStore }

export const presenceStore: MemoryStore =
  globalForInstance.__presenceStore ??
  (globalForInstance.__presenceStore = new MemoryStore())
