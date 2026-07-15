"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import {
  GAME_IDS,
  LOCATIONS,
  PRESENCE_TTL_MS,
  type GameId,
  type GroupPresence,
  type LocationId,
  type LocationMeta,
} from "@/lib/presence/types"

const POLL_INTERVAL_MS = 2000
// Tope fijo de grupos visibles por sala: mantiene la vista de una sola pantalla
// (sin scroll). Si hay más, se muestran los primeros y un "+N".
const MAX_GROUPS_PER_COLUMN = 4
const GAME_ID_SET = new Set<string>(GAME_IDS)
// Metadatos (etiqueta + color) de los 5 juegos, en orden canónico, para la
// barra de luces de progreso de cada grupo.
const GAME_META: LocationMeta[] = GAME_IDS.map(
  (id) => LOCATIONS.find((l) => l.id === id)!,
)

/* --------------------------------------------------------------------------
 * Estilo de las tarjetas:
 *  - El panel de cada sala usa EL COLOR DEL ÁMBITO como fondo (identidad fuerte,
 *    color brillante/claro) → su encabezado va en texto oscuro (`ON_COLOR_TEXT`).
 *  - La tarjeta de cada equipo usa `onLight()` (el mismo color oscurecido), un
 *    fondo oscuro → su texto va claro (`TEAM_TEXT`) y las luces de progreso
 *    vuelven a brillar como neón.
 * ------------------------------------------------------------------------- */
/** Versión oscura y legible de un color de acento (fondo de la card de equipo). */
const onLight = (color: string) => `color-mix(in oklch, ${color} 52%, black)`
const ON_COLOR_TEXT = "oklch(0.2 0.03 264)" // texto/acento sobre el panel de color
const TEAM_TEXT = "oklch(0.97 0.01 264)" // texto principal sobre la card de equipo
const TEAM_TEXT_SOFT = "oklch(0.8 0.03 264)" // texto secundario sobre la card de equipo

// Recordamos la clave del admin en el navegador del operador para no reingresarla.
const ADMIN_KEY_STORAGE = "ivo-admin-key"

type ListResponse = {
  ok: boolean
  now: number
  groups: GroupPresence[]
  error?: string
}

export function BackofficePanel() {
  const searchParams = useSearchParams()
  const [key, setKey] = useState(searchParams.get("key") ?? "")
  const [groups, setGroups] = useState<GroupPresence[]>([])
  const [serverNow, setServerNow] = useState<number>(Date.now())
  const [status, setStatus] = useState<"loading" | "ok" | "unauthorized" | "error">(
    "loading",
  )

  // Cache de avatares: se piden una vez por grupo, no en cada poll.
  const [avatars, setAvatars] = useState<Record<string, string | null>>({})
  const fetchedRef = useRef<Set<string>>(new Set())
  const keyInputRef = useRef<HTMLInputElement>(null)

  // Al montar, si no vino clave por la URL, usar la recordada en este navegador.
  // (Se lee en efecto, no en el inicializador de useState, para no romper el SSR.)
  useEffect(() => {
    if (key) return
    const saved = window.localStorage.getItem(ADMIN_KEY_STORAGE)
    if (saved) setKey(saved)
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al cambiar la clave, reseteamos la cache de avatares (pudieron pedirse 401).
  useEffect(() => {
    fetchedRef.current = new Set()
    setAvatars({})
  }, [key])

  // Polling del snapshot de presencia.
  useEffect(() => {
    let active = true
    let timer: number | undefined

    async function tick() {
      try {
        const res = await fetch(
          `/api/presence/list${key ? `?key=${encodeURIComponent(key)}` : ""}`,
          { cache: "no-store" },
        )
        if (!active) return
        if (res.status === 401) {
          setStatus("unauthorized")
        } else if (!res.ok) {
          setStatus("error")
        } else {
          const data = (await res.json()) as ListResponse
          setGroups(data.groups)
          setServerNow(data.now)
          setStatus("ok")
          // Clave válida: la recordamos para las próximas visitas a /admin.
          if (key) window.localStorage.setItem(ADMIN_KEY_STORAGE, key)
        }
      } catch {
        if (active) setStatus("error")
      }
      if (active) timer = window.setTimeout(tick, POLL_INTERVAL_MS)
    }

    setStatus("loading")
    tick()
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [key])

  // Trae los avatares que falten (una sola vez por grupo).
  useEffect(() => {
    const toFetch = groups.filter((g) => !fetchedRef.current.has(g.grupoId))
    if (toFetch.length === 0) return
    let active = true
    for (const g of toFetch) {
      fetchedRef.current.add(g.grupoId)
      fetch(
        `/api/presence/avatar?id=${encodeURIComponent(g.grupoId)}${key ? `&key=${encodeURIComponent(key)}` : ""}`,
        { cache: "no-store" },
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
        .then((d: { avatar: string | null }) => {
          if (active) setAvatars((prev) => ({ ...prev, [g.grupoId]: d.avatar ?? null }))
        })
        .catch(() => {
          // Reintentar en el próximo poll.
          fetchedRef.current.delete(g.grupoId)
        })
    }
    return () => {
      active = false
    }
  }, [groups, key])

  const byLocation = useMemo(() => {
    const map = new Map<LocationId, GroupPresence[]>()
    for (const loc of LOCATIONS) map.set(loc.id, [])
    for (const g of groups) {
      // Cualquier ubicación que no sea un juego cae en el lobby.
      const list = map.get(g.location) ?? map.get("lobby")!
      list.push(g)
    }
    // Orden fijo de grupos dentro de cada sala: por nombre (A–Z), estable.
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name))
    return map
  }, [groups])

  // Los 5 juegos en orden alfabético (AMI, CEO, CIDI, HMP, LUM) y el Lobby
  // siempre al final (más a la derecha).
  const orderedLocations = [...LOCATIONS].sort((a, b) => {
    const aGame = GAME_ID_SET.has(a.id)
    const bGame = GAME_ID_SET.has(b.id)
    if (aGame !== bGame) return aGame ? -1 : 1
    return a.label.localeCompare(b.label)
  })

  if (status === "unauthorized") {
    return <KeyGate keyInputRef={keyInputRef} onSubmit={(k) => setKey(k)} />
  }

  return (
    <main className="scanlines relative h-screen overflow-hidden bg-background px-4 py-4 sm:px-6 sm:py-6">
      {/* Fondo cyberpunk compartido con el resto de las vistas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0.12_0.04_264/0.85)_75%,oklch(0.1_0.04_264/0.96)_100%)]"
      />
      <div className="relative z-10 flex h-full w-full flex-col gap-4">
        <header>
          <h1 className="font-pixel text-lg leading-[1.4] neon-green sm:text-2xl">
            MONITOREO EN VIVO
          </h1>
          <p className="mt-1 font-mono text-xs text-foreground/80 sm:text-sm">
            {groups.length} grupo{groups.length === 1 ? "" : "s"} activo
            {groups.length === 1 ? "" : "s"}
          </p>
        </header>

        {/* Las 6 salas (5 juegos + Lobby), en orden alfabético, en una sola fila
            de 6 columnas que estira para ocupar toda la pantalla, sin scroll. */}
        <section className="grid flex-1 auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {orderedLocations.map((loc) => (
            <LocationColumn
              key={loc.id}
              label={loc.label}
              color={loc.color}
              groups={byLocation.get(loc.id) ?? []}
              serverNow={serverNow}
              avatars={avatars}
              muted={!GAME_ID_SET.has(loc.id)}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

function LocationColumn({
  label,
  color,
  groups,
  serverNow,
  avatars,
  muted = false,
}: {
  label: string
  color: string
  groups: GroupPresence[]
  serverNow: number
  avatars: Record<string, string | null>
  muted?: boolean
}) {
  // Tope fijo por sala para que la vista entre en una sola pantalla.
  const visible = groups.slice(0, MAX_GROUPS_PER_COLUMN)
  const overflow = groups.length - visible.length

  return (
    <div
      className="flex flex-col gap-3 overflow-hidden rounded-2xl border p-3 shadow-[0_4px_18px_oklch(0.1_0.04_264/0.55)]"
      style={{
        // Mismo color del ámbito, pero con menos intensidad: bajamos la opacidad
        // (no la saturación) para dejar que el fondo lo atenúe sin cambiar el RGB.
        backgroundColor: `color-mix(in oklch, ${color} 82%, transparent)`,
        borderColor: "color-mix(in oklch, black 22%, transparent)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          className={muted ? "font-mono text-sm font-semibold" : "font-pixel text-sm"}
          style={{ color: ON_COLOR_TEXT }}
        >
          {label}
        </h2>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-xs font-bold"
          style={{ color: TEAM_TEXT, backgroundColor: onLight(color) }}
        >
          {groups.length}
        </span>
      </div>

      {groups.length === 0 ? (
        <p
          className="font-mono text-xs"
          style={{ color: "color-mix(in oklch, black 55%, transparent)" }}
        >
          Sin grupos
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((g) => (
            <GroupCard
              key={g.grupoId}
              group={g}
              serverNow={serverNow}
              color={color}
              avatar={avatars[g.grupoId]}
            />
          ))}
          {overflow > 0 ? (
            <li
              className="px-1 font-mono text-[0.7rem] font-semibold"
              style={{ color: "color-mix(in oklch, black 65%, transparent)" }}
            >
              +{overflow} más
            </li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem.toString().padStart(2, "0")}s`
}

function GroupCard({
  group,
  serverNow,
  color,
  avatar,
}: {
  group: GroupPresence
  serverNow: number
  color: string
  avatar: string | null | undefined
}) {
  // Cerca del TTL sin heartbeat reciente => probable desconexión inminente.
  const stale = serverNow - group.lastSeen > PRESENCE_TTL_MS * 0.6
  const initial = group.name.charAt(0).toUpperCase() || "?"

  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2"
      style={{ backgroundColor: onLight(color) }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={`Foto de ${group.name}`}
          className="size-8 shrink-0 rounded-full object-cover"
          style={{ border: `1px solid ${color}` }}
        />
      ) : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full font-pixel text-xs"
          style={{
            color,
            border: `1px solid color-mix(in oklch, ${color} 60%, transparent)`,
            backgroundColor: "color-mix(in oklch, black 25%, transparent)",
          }}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium" style={{ color: TEAM_TEXT }}>
          {group.name}
        </p>
        <p
          className="font-mono text-[0.7rem]"
          style={{ color: stale ? "var(--neon-red)" : TEAM_TEXT_SOFT }}
        >
          {stale ? "⚠ " : ""}
          en sala hace {formatDuration(serverNow - group.since)}
        </p>
        <GameProgressBar completed={group.completed ?? []} />
      </div>
    </li>
  )
}

/**
 * Barra de luces de progreso de un grupo: una lucecita por cada uno de los 5
 * juegos, en orden fijo. Cada juego se identifica SOLO por su color (sin texto):
 * la luz se "prende" (color + glow del juego) cuando el grupo ya lo resolvió y
 * queda tenue —con el mismo color apagado— mientras esté pendiente. Así el
 * operador ve de un vistazo qué juegos completó cada equipo y cuáles le faltan.
 */
function GameProgressBar({ completed }: { completed: GameId[] }) {
  const done = new Set<GameId>(completed)

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <div className="flex flex-1 gap-1.5">
        {GAME_META.map((game) => {
          const lit = done.has(game.id as GameId)
          return (
            <span
              key={game.id}
              title={`${game.label}: ${lit ? "completado" : "pendiente"}`}
              className="h-2.5 flex-1 rounded-full border transition-all"
              style={
                lit
                  ? {
                      backgroundColor: game.color,
                      borderColor: game.color,
                      boxShadow: `0 0 8px ${game.color}`,
                    }
                  : {
                      backgroundColor: `color-mix(in oklch, ${game.color} 22%, transparent)`,
                      borderColor: `color-mix(in oklch, ${game.color} 50%, transparent)`,
                    }
              }
            />
          )
        })}
      </div>
      <span
        className="shrink-0 font-mono text-[0.62rem] font-semibold tabular-nums"
        style={{ color: TEAM_TEXT_SOFT }}
      >
        {done.size}/{GAME_META.length}
      </span>
    </div>
  )
}

function KeyGate({
  keyInputRef,
  onSubmit,
}: {
  keyInputRef: React.RefObject<HTMLInputElement | null>
  onSubmit: (key: string) => void
}) {
  return (
    <main className="scanlines relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Fondo cyberpunk compartido con el resto de las vistas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0.12_0.04_264/0.85)_75%,oklch(0.1_0.04_264/0.96)_100%)]"
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--neon-red)]/40 bg-[oklch(0.11_0.04_264/0.85)] p-6">
        <h1 className="font-pixel text-base neon-red">ACCESO RESTRINGIDO</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Ingresá la clave de administrador para ver el monitoreo.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const value = keyInputRef.current?.value.trim()
            if (value) onSubmit(value)
          }}
          className="flex flex-col gap-3"
        >
          <input
            ref={keyInputRef}
            type="password"
            placeholder="Clave"
            className="w-full rounded-md border-2 border-[var(--neon-cyan)]/40 bg-[oklch(0.16_0.04_264/0.7)] px-4 py-3 font-mono text-base text-foreground outline-none focus:border-[var(--neon-cyan)]"
          />
          <button
            type="submit"
            className="w-full rounded-md border-2 border-[var(--neon-green)] bg-[var(--neon-green)] px-4 py-3 font-pixel text-sm text-background transition-all hover:brightness-110"
          >
            ENTRAR
          </button>
        </form>
      </div>
    </main>
  )
}
