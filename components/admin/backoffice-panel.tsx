"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import {
  LOCATIONS,
  PRESENCE_TTL_MS,
  type GroupPresence,
  type LocationId,
} from "@/lib/presence/types"

const POLL_INTERVAL_MS = 2000
const GAME_IDS: LocationId[] = ["cidi", "ami", "hmp", "ceo", "lum"]
// Recordamos la clave del admin en el navegador del operador para no reingresarla.
const ADMIN_KEY_STORAGE = "ivo-admin-key"

type ListResponse = {
  ok: boolean
  now: number
  groups: GroupPresence[]
  error?: string
}

type GroupSort = "nombre" | "recientes" | "tiempo"
type RoomSort = "fijo" | "cantidad"

export function BackofficePanel() {
  const searchParams = useSearchParams()
  const [key, setKey] = useState(searchParams.get("key") ?? "")
  const [groups, setGroups] = useState<GroupPresence[]>([])
  const [serverNow, setServerNow] = useState<number>(Date.now())
  const [status, setStatus] = useState<"loading" | "ok" | "unauthorized" | "error">(
    "loading",
  )
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  // Controles de orden / filtro
  const [groupSort, setGroupSort] = useState<GroupSort>("nombre")
  const [roomSort, setRoomSort] = useState<RoomSort>("fijo")
  const [hideEmpty, setHideEmpty] = useState(false)

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
          setLastUpdate(Date.now())
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
      const list = map.get(g.location) ?? map.get("otro")!
      list.push(g)
    }
    // Orden de grupos dentro de cada sala.
    const sorter = (a: GroupPresence, b: GroupPresence) => {
      if (groupSort === "recientes") return b.since - a.since
      if (groupSort === "tiempo") return a.since - b.since
      return a.name.localeCompare(b.name)
    }
    for (const list of map.values()) list.sort(sorter)
    return map
  }, [groups, groupSort])

  const { orderedGames, orderedOthers } = useMemo(() => {
    const count = (id: LocationId) => byLocation.get(id)?.length ?? 0
    let games = LOCATIONS.filter((l) => GAME_IDS.includes(l.id))
    let others = LOCATIONS.filter((l) => !GAME_IDS.includes(l.id))
    if (roomSort === "cantidad") {
      games = [...games].sort((a, b) => count(b.id) - count(a.id))
      others = [...others].sort((a, b) => count(b.id) - count(a.id))
    }
    if (hideEmpty) {
      games = games.filter((l) => count(l.id) > 0)
      others = others.filter((l) => count(l.id) > 0)
    }
    return { orderedGames: games, orderedOthers: others }
  }, [byLocation, roomSort, hideEmpty])

  if (status === "unauthorized") {
    return <KeyGate keyInputRef={keyInputRef} onSubmit={(k) => setKey(k)} />
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-pixel text-lg leading-[1.4] neon-green sm:text-2xl">
              MONITOREO EN VIVO
            </h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground sm:text-sm">
              {groups.length} grupo{groups.length === 1 ? "" : "s"} activo
              {groups.length === 1 ? "" : "s"}
            </p>
          </div>
          <LiveIndicator status={status} lastUpdate={lastUpdate} />
        </header>

        <Toolbar
          groupSort={groupSort}
          roomSort={roomSort}
          hideEmpty={hideEmpty}
          onGroupSort={setGroupSort}
          onRoomSort={setRoomSort}
          onHideEmpty={setHideEmpty}
        />

        {/* Los 5 juegos, en grilla destacada */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedGames.map((loc) => (
            <LocationColumn
              key={loc.id}
              label={loc.label}
              color={loc.color}
              groups={byLocation.get(loc.id) ?? []}
              serverNow={serverNow}
              avatars={avatars}
            />
          ))}
        </section>

        {/* Ubicaciones auxiliares (plano, registro, otras rutas) */}
        {orderedOthers.length > 0 && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {orderedOthers.map((loc) => (
              <LocationColumn
                key={loc.id}
                label={loc.label}
                color={loc.color}
                groups={byLocation.get(loc.id) ?? []}
                serverNow={serverNow}
                avatars={avatars}
                muted
              />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

function Toolbar({
  groupSort,
  roomSort,
  hideEmpty,
  onGroupSort,
  onRoomSort,
  onHideEmpty,
}: {
  groupSort: GroupSort
  roomSort: RoomSort
  hideEmpty: boolean
  onGroupSort: (v: GroupSort) => void
  onRoomSort: (v: RoomSort) => void
  onHideEmpty: (v: boolean) => void
}) {
  const selectClass =
    "rounded-md border border-[var(--neon-cyan)]/40 bg-[oklch(0.16_0.04_264/0.7)] px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-[var(--neon-cyan)]"

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-[var(--neon-cyan)]/25 bg-[oklch(0.11_0.04_264/0.6)] px-4 py-3">
      <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        Grupos:
        <select
          className={selectClass}
          value={groupSort}
          onChange={(e) => onGroupSort(e.target.value as GroupSort)}
        >
          <option value="nombre">Nombre (A–Z)</option>
          <option value="recientes">Recién llegados</option>
          <option value="tiempo">Más tiempo en sala</option>
        </select>
      </label>

      <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        Salas:
        <select
          className={selectClass}
          value={roomSort}
          onChange={(e) => onRoomSort(e.target.value as RoomSort)}
        >
          <option value="fijo">Orden fijo</option>
          <option value="cantidad">Más concurridas</option>
        </select>
      </label>

      <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={hideEmpty}
          onChange={(e) => onHideEmpty(e.target.checked)}
          className="size-3.5 accent-[var(--neon-green)]"
        />
        Ocultar salas vacías
      </label>
    </div>
  )
}

function LiveIndicator({
  status,
  lastUpdate,
}: {
  status: "loading" | "ok" | "unauthorized" | "error"
  lastUpdate: number | null
}) {
  const [, force] = useState(0)
  // Re-render cada segundo para refrescar los contadores de tiempo.
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const ok = status === "ok"
  const label =
    status === "error"
      ? "Sin conexión"
      : status === "loading"
        ? "Conectando…"
        : lastUpdate
          ? `Actualizado hace ${Math.max(0, Math.round((Date.now() - lastUpdate) / 1000))}s`
          : "En vivo"

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--neon-cyan)]/30 bg-[oklch(0.11_0.04_264/0.85)] px-3 py-1.5">
      <span
        className={`size-2.5 rounded-full ${ok ? "animate-pulse" : ""}`}
        style={{
          backgroundColor: ok ? "var(--neon-green)" : "var(--neon-red)",
          boxShadow: `0 0 8px ${ok ? "var(--neon-green)" : "var(--neon-red)"}`,
        }}
        aria-hidden
      />
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
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
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border bg-[oklch(0.11_0.04_264/0.7)] p-4"
      style={{ borderColor: `color-mix(in oklch, ${color} 45%, transparent)` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            aria-hidden
          />
          <h2
            className={muted ? "font-mono text-sm font-semibold" : "font-pixel text-sm"}
            style={{ color }}
          >
            {label}
          </h2>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-xs font-bold"
          style={{
            color,
            backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
          }}
        >
          {groups.length}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground/60">Sin grupos</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((g) => (
            <GroupCard
              key={g.grupoId}
              group={g}
              serverNow={serverNow}
              color={color}
              avatar={avatars[g.grupoId]}
            />
          ))}
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
    <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-[oklch(0.16_0.04_264/0.6)] px-3 py-2">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={`Foto de ${group.name}`}
          className="size-8 shrink-0 rounded-full object-cover"
          style={{ border: `1px solid color-mix(in oklch, ${color} 55%, transparent)` }}
        />
      ) : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full font-pixel text-xs"
          style={{
            color,
            border: `1px solid color-mix(in oklch, ${color} 55%, transparent)`,
            backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
          }}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm text-foreground">{group.name}</p>
        <p
          className="font-mono text-[0.7rem]"
          style={{ color: stale ? "var(--neon-red)" : "var(--muted-foreground)" }}
        >
          {stale ? "⚠ " : ""}
          en sala hace {formatDuration(serverNow - group.since)}
        </p>
      </div>
    </li>
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--neon-red)]/40 bg-[oklch(0.11_0.04_264/0.85)] p-6">
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
