"use client"

import { CyberFrame } from "./cyber-frame"
import { FloorPlan, LAB_COLORS } from "./floor-plan"
import type { TeamData } from "./team-setup-screen"

const LEGEND_LABS = ["CIDI", "AMI", "HMP", "CEO", "LUM"] as const

export function ProcessingScreen({ team }: { team: TeamData }) {
  return (
    <CyberFrame fullWidth fitViewport contentClassName="max-w-none">
      <div className="flex h-full min-h-0 w-full max-w-[min(100vw-2rem,92rem)] flex-col gap-4 text-left sm:gap-6">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--neon-cyan)]/35 bg-[oklch(0.11_0.04_264/0.88)] px-3 py-2 shadow-[0_0_24px_color-mix(in_oklch,var(--neon-cyan)_20%,transparent)] backdrop-blur-sm sm:px-4 sm:py-3">
          <div className="size-12 overflow-hidden rounded-full border border-[var(--neon-cyan)]/60 sm:size-14">
            {team.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team.avatar || "/placeholder.svg"}
                alt={`Foto del equipo ${team.name}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-[oklch(0.2_0.05_263)] font-pixel text-xl neon-cyan sm:text-2xl">
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-pixel text-sm leading-none neon-green sm:text-base">
              Plano del piso
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground sm:text-sm">
              Equipo: <span className="font-semibold text-foreground">{team.name}</span>
            </p>
          </div>
        </div>

        {/* Plano del piso con laboratorios destacados */}
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-[1.5rem] border border-[var(--neon-cyan)]/30 bg-[oklch(0.09_0.04_264/0.72)] p-3 shadow-[0_0_36px_color-mix(in_oklch,var(--neon-cyan)_18%,transparent)] sm:rounded-[2rem] sm:p-4">
          <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto">
            <FloorPlan />
          </div>
        </div>

        {/* Referencia de laboratorios importantes */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground sm:justify-start">
          <span className="shrink-0">Laboratorios clave</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {LEGEND_LABS.map((lab) => (
              <span
                key={lab}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-pixel text-[0.6rem] tracking-wide"
                style={{
                  color: LAB_COLORS[lab],
                  borderColor: `color-mix(in oklch, ${LAB_COLORS[lab]} 55%, transparent)`,
                  backgroundColor: `color-mix(in oklch, ${LAB_COLORS[lab]} 12%, transparent)`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: LAB_COLORS[lab],
                    boxShadow: `0 0 6px ${LAB_COLORS[lab]}`,
                  }}
                  aria-hidden="true"
                />
                {lab}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CyberFrame>
  )
}
