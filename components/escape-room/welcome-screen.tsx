"use client"

import Image from "next/image"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { CyberFrame } from "./cyber-frame"
import { LAB_COLORS } from "./floor-plan"

// Cada letra de "ADDE" con el color de un ámbito; "LABS" en verde (CIDI).
const ADDE_LETTERS: { char: string; color: string }[] = [
  { char: "A", color: LAB_COLORS.AMI }, // violeta
  { char: "D", color: LAB_COLORS.HMP }, // amarillo
  { char: "D", color: LAB_COLORS.CEO }, // blanco
  { char: "E", color: LAB_COLORS.LUM }, // rojo
]

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <CyberFrame>
      <div className="flex w-full flex-col items-center gap-6 text-center sm:gap-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--neon-red)]/60 bg-[oklch(0.16_0.04_264/0.55)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[var(--neon-red)] shadow-[0_0_24px_color-mix(in_oklch,var(--neon-red)_20%,transparent)]">
          <AlertTriangle className="size-4" aria-hidden="true" />
          incidente crítico
        </div>

        {/* Hero: foto pixelada de "la empresa" (ADDE Labs) con el título de la
            crisis superpuesto, como un registro de seguridad intervenido. */}
        <figure className="group relative w-full overflow-hidden rounded-[1.25rem] border-2 border-[var(--neon-red)]/55 shadow-[0_0_40px_color-mix(in_oklch,var(--neon-red)_28%,transparent)]">
          <Image
            src="/images/ADDE_LABS.gif"
            alt="Instalaciones de ADDE Labs, la empresa donde se descontroló la IA"
            width={1672}
            height={941}
            priority
            className="h-auto w-full object-cover"
          />

          {/* Líneas de escaneo tipo CRT sobre la foto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,oklch(0_0_0/0.28)_0px,oklch(0_0_0/0.28)_1px,transparent_2px,transparent_4px)] mix-blend-multiply"
          />
          {/* Oscurecido inferior para que se lea el título */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,oklch(0.08_0.04_264/0.94)_0%,oklch(0.08_0.04_264/0.55)_38%,transparent_70%)]"
          />

          {/* Etiqueta de "cámara de seguridad" */}
          <figcaption className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-[var(--neon-cyan)]/40 bg-[oklch(0.08_0.04_264/0.72)] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--neon-cyan)] backdrop-blur-sm sm:text-[0.65rem]">
            <span className="size-1.5 animate-pulse rounded-full bg-[var(--neon-red)] shadow-[0_0_6px_var(--neon-red)]" />
            ADDE LABS · REC
          </figcaption>

          {/* Título de bienvenida sobre la foto */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <h1 className="glitch flicker font-pixel leading-[0.95] text-balance">
              <span className="block text-xl neon-cyan sm:text-3xl md:text-4xl">
                BIENVENIDOS A
              </span>
              <span className="mt-2 block text-3xl sm:text-5xl md:text-6xl">
                {ADDE_LETTERS.map((l, i) => (
                  <span
                    key={i}
                    style={{
                      color: l.color,
                      textShadow: `0 0 18px color-mix(in oklch, ${l.color} 65%, transparent)`,
                    }}
                  >
                    {l.char}
                  </span>
                ))}
                <span className="mx-2" />
                <span
                  style={{
                    color: LAB_COLORS.CIDI,
                    textShadow: `0 0 18px color-mix(in oklch, ${LAB_COLORS.CIDI} 65%, transparent)`,
                  }}
                >
                  LABS
                </span>
              </span>
            </h1>
          </div>
        </figure>

        <p className="mx-auto max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
          En ADDE Labs se intentó implementar una inteligencia artificial
          general para automatizar los controles de laboratorio. Uno de los
          integrantes del equipo se reveló contra la empresa e infectó la IA.
        </p>

        <div className="grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--neon-cyan)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-cyan)_10%,transparent)] backdrop-blur-sm">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-cyan)]">
              misión
            </p>
            <p className="mt-2 text-sm text-foreground">
              Recuperar el control de los laboratorios y encontrar al culpable.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--neon-green)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-green)_10%,transparent)] backdrop-blur-sm">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-green)]">
              amenaza
            </p>
            <p className="mt-2 text-sm text-foreground">
              La IA bloqueó los accesos a los laboratorios.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--neon-pink)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-pink)_10%,transparent)] backdrop-blur-sm">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-pink)]">
              objetivo
            </p>
            <p className="mt-2 text-sm text-foreground">
              Localizar al culpable y restaurar el control.
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
