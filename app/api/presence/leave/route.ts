import { NextResponse } from "next/server"

import { presenceStore } from "@/lib/presence/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Baja inmediata de un grupo. Se dispara desde el cliente con
 * `navigator.sendBeacon` en `pagehide`, para no dejar "fantasmas" cuando se
 * cierra la pestaña. Si el beacon nunca llega (crash, corte de red), el TTL del
 * store igual limpia al grupo. Por eso este endpoint es best-effort.
 */
export async function POST(request: Request) {
  let grupoId: string | undefined
  try {
    // sendBeacon manda el cuerpo como Blob/texto: parseamos como texto.
    const text = await request.text()
    if (text) {
      const parsed = JSON.parse(text) as { grupoId?: unknown }
      if (typeof parsed.grupoId === "string") grupoId = parsed.grupoId
    }
  } catch {
    // ignoramos: baja best-effort
  }

  if (!grupoId) {
    return NextResponse.json({ ok: false, error: "missing-grupoId" }, { status: 400 })
  }

  await presenceStore.leave(grupoId.slice(0, 64))
  return NextResponse.json({ ok: true })
}
