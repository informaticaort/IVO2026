import { NextResponse } from "next/server"

import { presenceStore } from "@/lib/presence/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Snapshot del estado actual para el backoffice. El panel lo consulta por
 * polling cada pocos segundos (más robusto que SSE en Vercel serverless).
 *
 * Protección simple por clave compartida: si `ADMIN_KEY` está definida, hay que
 * pasar `?key=...` que coincida. Si no está definida (dev local), queda abierto.
 */
export async function GET(request: Request) {
  const adminKey = process.env.ADMIN_KEY
  if (adminKey) {
    const key = new URL(request.url).searchParams.get("key")
    if (key !== adminKey) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
  }

  const groups = await presenceStore.list()
  // Orden estable: por nombre para que la UI no "salte" entre polls.
  groups.sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json(
    { ok: true, now: Date.now(), groups },
    { headers: { "Cache-Control": "no-store" } },
  )
}
