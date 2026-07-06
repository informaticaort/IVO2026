"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import {
  HEARTBEAT_INTERVAL_MS,
  pathToLocation,
  type LocationId,
} from "@/lib/presence/types"
import { ensureAvatarUploaded, ensureGroupId, readTeamName } from "./use-group-id"

/**
 * Componente invisible que reporta la ubicación del grupo al backend.
 *
 * Se monta una sola vez en el layout raíz, así que NO hay que tocar los 5
 * juegos: detecta la ruta con `usePathname()` y emite automáticamente cada vez
 * que el grupo cambia de vista, más un heartbeat periódico que mantiene vivo su
 * TTL. Al cerrar la pestaña manda una baja inmediata con `sendBeacon`.
 *
 * No reporta en `/admin` (el administrador no es un participante).
 */
export function PresenceReporter() {
  const pathname = usePathname()
  // Guardamos la ubicación actual en un ref para que el heartbeat siempre use
  // el valor más reciente sin recrear el intervalo en cada navegación.
  const locationRef = useRef<LocationId>("otro")
  const isAdmin = pathname?.startsWith("/admin") ?? false

  useEffect(() => {
    if (isAdmin) return
    locationRef.current = pathToLocation(pathname ?? "/")

    const grupoId = ensureGroupId()
    // Respaldo: sube la foto si aún no se subió (no-op si ya está hecha).
    void ensureAvatarUploaded(grupoId)

    // El efecto se recrea al cambiar de ruta, así que `since` marca el momento
    // exacto en que el grupo entró a esta sala y se mantiene entre heartbeats.
    const since = Date.now()

    function report() {
      const payload = JSON.stringify({
        grupoId,
        name: readTeamName(),
        location: locationRef.current,
        path: pathname ?? "",
        since,
      })
      // `keepalive` permite que el fetch sobreviva a una navegación en curso.
      fetch("/api/presence/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* offline / red caída: el próximo heartbeat reintenta */
      })
    }

    // Reporte inmediato al entrar a la vista + heartbeat periódico.
    report()
    const interval = window.setInterval(report, HEARTBEAT_INTERVAL_MS)

    // Baja inmediata al cerrar/ocultar la pestaña (best-effort).
    function leave() {
      const body = JSON.stringify({ grupoId })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/presence/leave",
          new Blob([body], { type: "application/json" }),
        )
      }
    }
    window.addEventListener("pagehide", leave)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("pagehide", leave)
    }
  }, [pathname, isAdmin])

  return null
}
