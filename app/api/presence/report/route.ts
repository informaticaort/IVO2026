import { NextResponse } from "next/server"

import { presenceStore } from "@/lib/presence/store"
import { GAME_IDS, type GroupPresence, type LocationId } from "@/lib/presence/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_LOCATIONS: LocationId[] = ["ami", "ceo", "cidi", "hmp", "lum", "lobby"]

/**
 * Heartbeat de un grupo. El cliente lo llama al entrar a una vista y cada pocos
 * segundos mientras está activo. Cada llamada reinicia el TTL del grupo.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 })
  }

  const { grupoId, name, location, path, since, completed } = (body ?? {}) as Record<
    string,
    unknown
  >

  if (typeof grupoId !== "string" || grupoId.length === 0) {
    return NextResponse.json({ ok: false, error: "missing-grupoId" }, { status: 400 })
  }
  // Ubicación desconocida (o de un cliente viejo que aún reporta plano/otro) se
  // pliega al lobby, así el grupo nunca se pierde del panel.
  const loc: LocationId = VALID_LOCATIONS.includes(location as LocationId)
    ? (location as LocationId)
    : "lobby"

  const now = Date.now()
  // `since` lo fija el cliente al entrar a la sala; lo saneamos para que no
  // quede en el futuro ni antes de un margen razonable.
  const sinceMs =
    typeof since === "number" && since > 0 && since <= now ? since : now

  // Filtramos contra `GAME_IDS`: descarta valores inválidos, elimina duplicados
  // y deja el progreso en orden canónico.
  const completedGames = Array.isArray(completed)
    ? GAME_IDS.filter((id) => (completed as unknown[]).includes(id))
    : []

  const presence: GroupPresence = {
    grupoId: grupoId.slice(0, 64),
    name: (typeof name === "string" ? name : "Equipo").slice(0, 60) || "Equipo",
    location: loc,
    path: typeof path === "string" ? path.slice(0, 120) : "",
    since: sinceMs,
    lastSeen: now,
    completed: completedGames,
  }

  await presenceStore.report(presence)
  return NextResponse.json({ ok: true })
}
