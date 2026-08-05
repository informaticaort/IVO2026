"use client"

import { useEffect, useState } from "react"

import { DONE_KEY_PREFIX } from "@/lib/presence/types"
import { LAB_COLORS } from "./floor-plan"

// Las 5 salas del piso, en orden de juego (CIDI es la final). El progreso se
// lee de localStorage: LabConversation marca `escape-room-done-<SALA>` al
// resolver cada ámbito.
const ROOMS = ["AMI", "HMP", "CEO", "LUM", "CIDI"] as const

/**
 * Panel lateral del plano: lleva el registro de cuántas salas se completaron.
 * Se lee al montar (el plano se re-monta al volver de cada juego, así queda
 * al día).
 */
export function RoomsProgress() {
  const [done, setDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const next: Record<string, boolean> = {}
      for (const room of ROOMS) {
        next[room] = Boolean(localStorage.getItem(`${DONE_KEY_PREFIX}${room}`))
      }
      setDone(next)
    } catch {
      /* noop */
    }
  }, [])

  const count = ROOMS.filter((room) => done[room]).length

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 rounded-[1.5rem] border border-[var(--neon-cyan)]/30 bg-[oklch(0.09_0.04_264/0.72)] p-4 shadow-[0_0_36px_color-mix(in_oklch,var(--neon-cyan)_18%,transparent)] lg:w-72">
      <div>
        <p className="font-pixel text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          Salas completadas
        </p>
        <p className="mt-1 font-pixel text-3xl neon-green">
          {count}
          <span className="ml-1 text-lg text-muted-foreground">
            / {ROOMS.length}
          </span>
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {ROOMS.map((room) => {
          const ok = done[room]
          const color = LAB_COLORS[room]
          return (
            <li
              key={room}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{
                borderColor: ok
                  ? `color-mix(in oklch, ${color} 55%, transparent)`
                  : "oklch(0.62 0.03 264 / 0.4)",
                backgroundColor: ok
                  ? `color-mix(in oklch, ${color} 12%, transparent)`
                  : "oklch(0.15 0.03 264 / 0.4)",
              }}
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: ok ? color : "oklch(0.5 0.02 264)",
                  boxShadow: ok ? `0 0 6px ${color}` : undefined,
                }}
              />
              <span
                className="flex-1 font-pixel text-xs tracking-wide"
                style={{ color: ok ? color : "oklch(0.62 0.03 264)" }}
              >
                {room}
              </span>
              <span
                className={`font-mono text-[0.7rem] ${
                  ok ? "text-[var(--neon-green)]" : "text-muted-foreground"
                }`}
              >
                {ok ? "✓ Completada" : "Pendiente"}
              </span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
