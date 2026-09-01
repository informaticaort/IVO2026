import { NextResponse } from "next/server"

import { isAdminRequest } from "@/lib/presence/admin-key"
import { presenceStore } from "@/lib/presence/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Snapshot del estado actual para el backoffice. El panel lo consulta por
 * polling cada pocos segundos (más robusto que SSE en Vercel serverless).
 *
 * Protección simple por clave compartida: hay que pasar `?key=...` con la clave
 * del panel (ver lib/presence/admin-key.ts).
 */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const groups = await presenceStore.list()
  // Orden estable: por nombre para que la UI no "salte" entre polls.
  groups.sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json(
    { ok: true, now: Date.now(), groups },
    { headers: { "Cache-Control": "no-store" } },
  )
}
