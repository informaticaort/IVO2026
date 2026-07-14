"use client"

import { useEffect, useState, type ReactNode } from "react"
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
  /**
   * Zona clickeable sobre la imagen (en % relativos a la imagen) que inicia
   * el juego. Si se define, reemplaza al botón "Iniciar juego": al terminar
   * las preguntas la zona se "enciende" como pantalla azul y se puede clickear.
   * `clipPath` permite ajustar la forma a la pantalla (perspectiva) en vez de
   * un rectángulo exacto.
   */
  gameHotspot?: {
    left: string
    top: string
    width: string
    height: string
    clipPath?: string
  }
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"]

/** "CEO" -> "/images/CeoPixelArt.png" */
function imageForAcronym(acronym: string) {
  const name =
    acronym.charAt(0).toUpperCase() + acronym.slice(1).toLowerCase()
  return `/images/${name}PixelArt.png`
}

export function LabConversation({
  config,
  renderGame,
}: {
  config: LabConversationConfig
  /** Juego que se muestra al iniciar; recibe `exit` para volver a la charla. */
  renderGame?: (opts: { exit: () => void }) => ReactNode
}) {
  const { acronym, speaker, greeting, questions, closingSpeech, gameHotspot } =
    config

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

  // Con hotspot: al terminar las preguntas se enciende la pantalla azul.
  const hotspotActive = allAsked && !!gameHotspot && !started

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-background p-3 sm:p-4">
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
          className="relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          <div className="relative">
            <Image
              src={image}
              alt={`Retrato de ${speaker}`}
              width={960}
              height={960}
              priority
              className="max-h-[92vh] w-auto rounded-[1rem] object-contain"
            />

            {/* Pantalla azul clickeable que reemplaza al botón "Iniciar juego".
                El clip-path recorta la forma real de la pantalla; el glow se
                aplica con drop-shadow en el botón para que siga esa forma. */}
            {hotspotActive ? (
              <button
                type="button"
                onClick={() => setStarted(true)}
                aria-label="Computadora con pantalla azul: iniciar el juego"
                title="Esta computadora se ve extraña…"
                className="absolute z-30 cursor-pointer"
                style={{
                  left: gameHotspot.left,
                  top: gameHotspot.top,
                  width: gameHotspot.width,
                  height: gameHotspot.height,
                  filter: "drop-shadow(0 0 10px #2f6bff)",
                }}
              >
                <span
                  className="flex size-full animate-pulse flex-col items-start gap-0.5 bg-[linear-gradient(135deg,#2a5cff_0%,#0a36e8_45%,#0629b8_100%)] p-1 font-pixel text-[0.45rem] leading-none text-white/90"
                  style={{ clipPath: gameHotspot.clipPath }}
                >
                  :(
                  <span className="h-px w-2/3 bg-white/40" />
                  <span className="h-px w-1/2 bg-white/30" />
                </span>
              </button>
            ) : null}
          </div>

          {/* Overlay de diálogo + opciones, pegado al fondo de la imagen.
              Compacto y semitransparente para tapar lo menos posible. */}
          <div className="absolute inset-x-2 bottom-2 flex max-h-[60%] flex-col justify-end gap-2">
            {/* Diálogo del personaje */}
            <div className="flex items-start gap-2 rounded-xl border border-[var(--neon-cyan)]/35 bg-[oklch(0.08_0.04_264/0.72)] px-4 py-3 backdrop-blur-sm">
              {/* Retrato del jugador */}
              <div className="hidden shrink-0 sm:block">
                <div className="size-12 overflow-hidden rounded-full border-2 border-[var(--neon-cyan)]/70 bg-[oklch(0.12_0.05_263)]">
                  {player.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.avatar}
                      alt={`Foto de ${player.name}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-pixel text-lg neon-cyan">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-pixel text-[0.7rem] uppercase tracking-[0.25em] neon-cyan">
                  {speaker}
                </p>
                <p className="whitespace-pre-line font-mono text-[0.9rem] leading-snug text-foreground/95 sm:text-[0.95rem]">
                  {currentSpeech}
                </p>
              </div>
            </div>

            {/* Opciones (aparecen debajo del diálogo), en 2 columnas */}
            {!started ? (
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--neon-cyan)]/30 bg-[oklch(0.08_0.04_264/0.72)] px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="font-mono text-[0.72rem] text-muted-foreground">
                    {allAsked
                      ? gameHotspot
                        ? "Ya preguntaste todo. Una de las computadoras se puso azul… hacé clic en ella."
                        : "Ya preguntaste todo. Podés iniciar el juego."
                      : `Elegí una pregunta · faltan ${remaining} para iniciar`}
                  </p>
                  {allAsked && !gameHotspot ? (
                    <button
                      type="button"
                      onClick={() => setStarted(true)}
                      className="shrink-0 rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-3 py-1.5 font-pixel text-[0.68rem] text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
                    >
                      Iniciar juego
                    </button>
                  ) : null}
                </div>
                <ul className="grid min-h-0 grid-cols-1 gap-x-3 gap-y-1 overflow-y-auto sm:grid-cols-2">
                  {visibleQuestions.map((q, i) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => handleAsk(q)}
                        className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left font-mono text-[0.98rem] leading-snug text-foreground/90 transition-colors hover:bg-[color-mix(in_oklch,var(--neon-cyan)_16%,transparent)] sm:text-[1.02rem]"
                      >
                        <span className="mt-px font-pixel text-sm neon-cyan">
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

      {/* Juego del ámbito (overlay a pantalla completa) */}
      {started && renderGame
        ? renderGame({ exit: () => setStarted(false) })
        : null}
    </main>
  )
}
