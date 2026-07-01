"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { LAB_COLORS } from "./floor-plan"

export type LabQuestion = { id: string; question: string; answer: string }

export type LabConversationConfig = {
  /** Acrónimo del ámbito: define imagen (…PixelArt.png) y color del recuadro. */
  acronym: string
  /** Nombre del personaje que responde. */
  speaker: string
  /** Frase inicial que aparece al entrar. */
  greeting: string
  /** Preguntas disponibles (se habilitan de a 2). */
  questions: LabQuestion[]
  /** Frase de cierre al iniciar el juego. */
  closingSpeech: string
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"]

/** "CEO" -> "/images/CeoPixelArt.png" */
function imageForAcronym(acronym: string) {
  const name =
    acronym.charAt(0).toUpperCase() + acronym.slice(1).toLowerCase()
  return `/images/${name}PixelArt.png`
}

export function LabConversation({ config }: { config: LabConversationConfig }) {
  const { acronym, speaker, greeting, questions, closingSpeech } = config

  const image = imageForAcronym(acronym)
  const color = LAB_COLORS[acronym] ?? "var(--neon-cyan)"

  // Diálogo actual que "dice" el personaje de la imagen.
  const [speech, setSpeech] = useState<string>(greeting)
  const [asked, setAsked] = useState<string[]>([])
  const [started, setStarted] = useState(false)

  // Retrato del jugador (equipo) que carga en la pantalla anterior.
  const [player, setPlayer] = useState<{ name: string; avatar: string | null }>(
    { name: "Detective", avatar: null }
  )

  useEffect(() => {
    const saved = sessionStorage.getItem("escape-room-team")
    if (!saved) return
    try {
      const p = JSON.parse(saved) as { name?: string; avatar?: string | null }
      setPlayer({ name: p.name || "Detective", avatar: p.avatar ?? null })
    } catch {
      /* noop */
    }
  }, [])

  const allAsked = asked.length === questions.length
  const remaining = questions.length - asked.length

  // Mostramos solo 2 preguntas por vez; al elegir una aparece la siguiente.
  const pending = questions.filter((q) => !asked.includes(q.id))
  const visibleQuestions = pending.slice(0, 2)

  function handleAsk(q: LabQuestion) {
    setSpeech(q.answer)
    if (!asked.includes(q.id)) setAsked((prev) => [...prev, q.id])
  }

  const currentSpeech = started ? closingSpeech : speech

  return (
    <main className="scanlines relative flex h-screen w-screen flex-col overflow-hidden bg-background p-3 sm:p-4">
      {/* Fondo de la escena */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.1_0.04_264/0.35)_0%,transparent_30%,oklch(0.1_0.04_264/0.85)_100%)]"
      />

      {/* Volver */}
      <Link
        href="/plano"
        className="absolute right-4 top-4 z-40 rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
      >
        Volver
      </Link>

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {/* Escenario: la imagen queda fija y el diálogo va superpuesto adentro */}
        <div
          className="relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-2"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          <Image
            src={image}
            alt={`Retrato de ${speaker}`}
            width={960}
            height={960}
            priority
            className="max-h-[86vh] w-auto rounded-[1rem] object-contain"
          />

          {/* Overlay de diálogo + opciones, pegado al fondo de la imagen.
              Compacto y semitransparente para tapar lo menos posible. */}
          <div className="absolute inset-x-2 bottom-2 flex max-h-[55%] flex-col justify-end gap-1.5">
            {/* Diálogo del personaje */}
            <div className="flex items-start gap-2 rounded-xl border border-[var(--neon-cyan)]/35 bg-[oklch(0.08_0.04_264/0.72)] px-3 py-2 backdrop-blur-sm">
              {/* Retrato del jugador */}
              <div className="hidden shrink-0 sm:block">
                <div className="size-11 overflow-hidden rounded-full border-2 border-[var(--neon-cyan)]/70 bg-[oklch(0.12_0.05_263)]">
                  {player.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.avatar}
                      alt={`Foto de ${player.name}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-pixel text-base neon-cyan">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 font-pixel text-[0.55rem] uppercase tracking-[0.25em] neon-cyan">
                  {speaker}
                </p>
                <p className="whitespace-pre-line font-mono text-[0.75rem] leading-snug text-foreground/95">
                  {currentSpeech}
                </p>
              </div>
            </div>

            {/* Opciones (aparecen debajo del diálogo), en 2 columnas */}
            {!started ? (
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--neon-cyan)]/30 bg-[oklch(0.08_0.04_264/0.72)] px-2 py-1.5 backdrop-blur-sm">
                <div className="flex items-center justify-between px-1 pb-1">
                  <p className="font-mono text-[0.6rem] text-muted-foreground">
                    {allAsked
                      ? "Ya preguntaste todo. Podés iniciar el juego."
                      : `Elegí una pregunta · faltan ${remaining} para iniciar`}
                  </p>
                  {allAsked ? (
                    <button
                      type="button"
                      onClick={() => setStarted(true)}
                      className="shrink-0 rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-3 py-1 font-pixel text-[0.6rem] text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
                    >
                      Iniciar juego
                    </button>
                  ) : null}
                </div>
                <ul className="grid min-h-0 grid-cols-1 gap-x-3 gap-y-0.5 overflow-y-auto sm:grid-cols-2">
                  {visibleQuestions.map((q, i) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => handleAsk(q)}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-1 text-left font-mono text-[0.75rem] leading-snug text-foreground/90 transition-colors hover:bg-[color-mix(in_oklch,var(--neon-cyan)_16%,transparent)]"
                      >
                        <span className="mt-px font-pixel text-xs neon-cyan">
                          {LETTERS[i]}
                        </span>
                        <span>{q.question}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
