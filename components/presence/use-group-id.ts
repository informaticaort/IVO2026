"use client"

import { useEffect, useState } from "react"

const GROUP_ID_KEY = "escape-room-grupo-id"
const TEAM_KEY = "escape-room-team"
const AVATAR_DONE_KEY = "escape-room-avatar-uploaded"

/** Lee el nombre del equipo guardado en el registro (o un default). */
export function readTeamName(): string {
  if (typeof window === "undefined") return "Equipo"
  try {
    const raw = window.sessionStorage.getItem(TEAM_KEY)
    if (!raw) return "Equipo"
    const parsed = JSON.parse(raw) as { name?: unknown }
    return typeof parsed.name === "string" && parsed.name.trim()
      ? parsed.name.trim()
      : "Equipo"
  } catch {
    return "Equipo"
  }
}

/** Lee el avatar (data URL) guardado en el registro, o null. */
function readTeamAvatar(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(TEAM_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { avatar?: unknown }
    return typeof parsed.avatar === "string" && parsed.avatar.startsWith("data:image/")
      ? parsed.avatar
      : null
  } catch {
    return null
  }
}

/**
 * Reduce una foto (data URL) a una miniatura chica para que viaje liviana y
 * ocupe poco en el servidor. Dibuja en un canvas a `max` px y exporta JPEG.
 */
function downscaleDataUrl(dataUrl: string, max = 96, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Sube la miniatura del avatar del grupo, una sola vez por sesión (salvo
 * `force`, que se usa cuando el equipo cambia la foto al re-registrarse).
 */
export async function ensureAvatarUploaded(
  grupoId: string,
  opts: { force?: boolean } = {},
): Promise<void> {
  if (typeof window === "undefined") return
  const avatar = readTeamAvatar()
  if (!avatar) return
  if (!opts.force && window.sessionStorage.getItem(AVATAR_DONE_KEY) === grupoId) return

  try {
    const thumb = await downscaleDataUrl(avatar)
    const res = await fetch("/api/presence/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grupoId, avatar: thumb }),
      keepalive: true,
    })
    if (res.ok) window.sessionStorage.setItem(AVATAR_DONE_KEY, grupoId)
  } catch {
    /* sin conexión: se reintenta en el próximo montaje */
  }
}

/** Devuelve (creándolo si hace falta) el id único y estable de este grupo. */
export function ensureGroupId(): string {
  const existing = window.sessionStorage.getItem(GROUP_ID_KEY)
  if (existing) return existing
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `g_${Date.now()}_${Math.random().toString(36).slice(2)}`
  window.sessionStorage.setItem(GROUP_ID_KEY, id)
  return id
}

/**
 * Hook cliente que expone el `grupoId` estable de la pestaña actual.
 * Devuelve `null` durante el primer render del servidor / hidratación.
 */
export function useGroupId(): string | null {
  const [grupoId, setGrupoId] = useState<string | null>(null)
  useEffect(() => {
    setGrupoId(ensureGroupId())
  }, [])
  return grupoId
}
