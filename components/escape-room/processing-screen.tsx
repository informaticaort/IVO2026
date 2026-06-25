"use client"

import { CyberFrame } from "./cyber-frame"
import { FloorPlan } from "./floor-plan"
import type { TeamData } from "./team-setup-screen"

export function ProcessingScreen({ team }: { team: TeamData }) {
  return (
    <CyberFrame fullWidth contentClassName="max-w-none">
      <div className="flex w-full max-w-[min(100vw-2rem,92rem)] flex-col gap-4 text-left sm:gap-6">
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
          <div className="flex h-[min(68vh,48rem)] w-full items-center justify-center overflow-visible">
            <FloorPlan />
          </div>
        </div>

        {/* Referencia de laboratorios importantes */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground sm:justify-start">
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_30%,transparent)]" />
            Laboratorios clave
          </span>
          <span className="font-semibold text-[var(--neon-green)]">
            CIDI · AMI · HMP · CEO · LUM
          </span>
        </div>
      </div>
    </CyberFrame>
  )
}
