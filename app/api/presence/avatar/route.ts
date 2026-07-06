import { NextResponse } from "next/server"

import { presenceStore } from "@/lib/presence/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Tope de tamaño del data URL ya comprimido (thumbnail ~96px). Evita que un
// cliente mande una foto gigante sin comprimir.
const MAX_AVATAR_CHARS = 300_000

/**
 * Sube (una sola vez por grupo) la miniatura del avatar. Se guarda aparte de la
 * presencia, con TTL largo, para no reenviar la foto en cada heartbeat/poll.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 })
  }

  const { grupoId, avatar } = (body ?? {}) as Record<string, unknown>

  if (typeof grupoId !== "string" || grupoId.length === 0) {
    return NextResponse.json({ ok: false, error: "missing-grupoId" }, { status: 400 })
  }
  if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "invalid-avatar" }, { status: 400 })
  }
  if (avatar.length > MAX_AVATAR_CHARS) {
    return NextResponse.json({ ok: false, error: "avatar-too-large" }, { status: 413 })
  }

  await presenceStore.setAvatar(grupoId.slice(0, 64), avatar)
  return NextResponse.json({ ok: true })
}

/**
 * Devuelve la miniatura de un grupo. Sólo para el backoffice: comparte la misma
 * protección por clave que /api/presence/list.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const adminKey = process.env.ADMIN_KEY
  if (adminKey && url.searchParams.get("key") !== adminKey) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const grupoId = url.searchParams.get("id")
  if (!grupoId) {
    return NextResponse.json({ ok: false, error: "missing-id" }, { status: 400 })
  }

  const avatar = await presenceStore.getAvatar(grupoId.slice(0, 64))
  return NextResponse.json(
    { ok: true, avatar },
    { headers: { "Cache-Control": "no-store" } },
  )
}
