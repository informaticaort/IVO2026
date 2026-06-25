"use client"

import { AlertTriangle, ArrowRight } from "lucide-react"
import { CyberFrame } from "./cyber-frame"

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <CyberFrame>
      <div className="flex w-full flex-col items-center gap-6 text-center sm:gap-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--neon-red)]/60 bg-[oklch(0.16_0.04_264/0.55)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[var(--neon-red)] shadow-[0_0_24px_color-mix(in_oklch,var(--neon-red)_20%,transparent)]">
          <AlertTriangle className="size-4" aria-hidden="true" />
          incidente crítico
        </div>

        <div className="space-y-5">
          <h1 className="glitch flicker font-pixel leading-[0.95] text-balance">
            <span className="block text-3xl neon-green sm:text-5xl md:text-6xl">
              IA
            </span>
            <span className="mt-3 block text-2xl neon-cyan sm:text-4xl md:text-5xl">
              FUERA DE
            </span>
            <span className="mt-3 block text-3xl neon-gradient sm:text-5xl md:text-6xl">
              CONTROL
            </span>
          </h1>

          <p className="mx-auto max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            En el Centro de Investigación y Desarrollo en Informática se intentó
            implementar una inteligencia artificial general para automatizar los
            controles de laboratorio. El sistema evolucionó demasiado rápido y
            ahora bloquea el acceso, altera los protocolos y mantiene el
            complejo en cuarentena.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--neon-cyan)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-cyan)_10%,transparent)] backdrop-blur-sm">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-cyan)]">
              misión
            </p>
            <p className="mt-2 text-sm text-foreground">
              Recuperar el control de los laboratorios.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--neon-green)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-green)_10%,transparent)] backdrop-blur-sm">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-green)]">
              amenaza
            </p>
            <p className="mt-2 text-sm text-foreground">
              La IA manipula los accesos.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--neon-pink)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-pink)_10%,transparent)] backdrop-blur-sm">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-pink)]">
              objetivo
            </p>
            <p className="mt-2 text-sm text-foreground">
              Resolver pistas y reactivar los protocolos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="pulse-border group mt-2 inline-flex items-center gap-3 rounded-md border-2 border-[var(--neon-red)] bg-[oklch(0.16_0.04_264/0.6)] px-7 py-4 font-pixel text-base text-[var(--neon-red)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--neon-red)] hover:text-background focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-lg"
        >
          <span>COMENZAR</span>
          <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </CyberFrame>
  )
}
