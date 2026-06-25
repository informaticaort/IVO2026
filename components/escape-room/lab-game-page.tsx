import Link from "next/link"
import type { ReactNode } from "react"

import { CyberFrame } from "./cyber-frame"

type LabGamePageProps = {
  acronym: string
  title: string
  description: string
  accentClassName: string
  children?: ReactNode
}

export function LabGamePage({
  acronym,
  title,
  description,
  accentClassName,
  children,
}: LabGamePageProps) {
  return (
    <CyberFrame>
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center sm:gap-8">
        <div className={`rounded-3xl border border-current/35 bg-[oklch(0.11_0.04_264/0.88)] px-6 py-4 shadow-[0_0_32px_color-mix(in_oklch,currentColor_20%,transparent)] ${accentClassName}`}>
          <p className="font-pixel text-xs uppercase tracking-[0.35em] opacity-80">
            Laboratorio {acronym}
          </p>
          <h1 className="mt-3 font-pixel text-3xl leading-tight sm:text-4xl">
            {title}
          </h1>
        </div>

        <p className="max-w-xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>

        <div className="w-full rounded-[1.5rem] border border-[var(--neon-cyan)]/30 bg-[oklch(0.09_0.04_264/0.72)] p-5 text-left shadow-[0_0_30px_color-mix(in_oklch,var(--neon-cyan)_15%,transparent)] sm:p-6">
          {children ?? (
            <>
              <p className="font-pixel text-sm neon-green">Próxima pantalla</p>
              <p className="mt-3 font-mono text-sm leading-relaxed text-foreground/90">
                Acá podés construir el juego propio de este laboratorio.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/plano"
            className="rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-3 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background sm:text-sm"
          >
            
            Volver al plano
          </Link>
        </div>
      </div>
    </CyberFrame>
  )
}