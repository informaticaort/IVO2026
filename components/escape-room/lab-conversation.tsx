"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { DONE_KEY_PREFIX } from "@/lib/presence/types"
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
   * Frase genérica que se muestra cuando el jugador vuelve a entrar al ámbito
   * DESPUÉS de haberlo resuelto: puede revisar los logs de la entrevista pero
   * ya no puede volver a preguntar ni a jugar. Si se omite, se usa una por
   * defecto.
   */
  completedSpeech?: string
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
    /**
     * Vista previa opcional que reemplaza la pantalla azul genérica con
     * ":(" por un recorte de otra imagen (p. ej. el escritorio real de ese
     * ámbito), para que la "pantalla prendida" se vea acorde a lo que hay
     * del otro lado. `backgroundSize`/`backgroundPosition` son los valores
     * CSS para recortar la imagen completa a la zona deseada.
     */
    preview?: {
      image: string
      backgroundSize: string
      backgroundPosition: string
    }
  }
  /**
   * Si es true, el juego se muestra DENTRO del mismo recuadro con borde y glow
   * que el retrato (como en las entrevistas), en lugar de un overlay a pantalla
   * completa. El componente del juego debe renderizarse como panel contenido
   * (sin `fixed inset-0`).
   */
  framedGame?: boolean
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"]

const DEFAULT_COMPLETED_SPEECH =
  "Este sector ya quedó resuelto. No tengo nada nuevo para contarte, " +
  "pero podés revisar el registro de la entrevista cuando quieras."

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
  /**
   * Juego que se muestra al iniciar. Recibe `exit` para volver a la charla y
   * `complete` para marcar el ámbito como resuelto (se llama al ganar).
   */
  renderGame?: (opts: { exit: () => void; complete: () => void }) => ReactNode
}) {
  const {
    acronym,
    speaker,
    greeting,
    questions,
    closingSpeech,
    completedSpeech,
    gameHotspot,
    framedGame,
  } = config

  const image = imageForAcronym(acronym)
  const color = LAB_COLORS[acronym] ?? "var(--neon-cyan)"

  // Diálogo actual que "dice" el personaje de la imagen.
  const [speech, setSpeech] = useState<string>(greeting)
  const [asked, setAsked] = useState<string[]>([])
  const [started, setStarted] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  // `completed` = el ámbito ya fue resuelto en una visita anterior.
  const [completed, setCompleted] = useState(false)

  const doneKey = `${DONE_KEY_PREFIX}${acronym}`

  // Al entrar: si este ámbito ya está resuelto, no repetimos toda la entrevista.
  // Damos por hechas todas las preguntas (para que el registro quede completo),
  // mostramos una frase genérica y ocultamos las preguntas y el juego.
  useEffect(() => {
    try {
      if (localStorage.getItem(doneKey)) {
        setCompleted(true)
        setAsked(questions.map((q) => q.id))
        setSpeech(completedSpeech ?? DEFAULT_COMPLETED_SPEECH)
      }
    } catch {
      /* noop */
    }
  }, [doneKey, questions, completedSpeech])

  // Marca el ámbito como resuelto (lo llama el juego al ganar).
  function markCompleted() {
    try {
      localStorage.setItem(doneKey, "1")
    } catch {
      /* noop */
    }
    setCompleted(true)
  }

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

  // Transcripción de la entrevista, en el orden en que se hicieron las preguntas.
  const transcript = asked
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is LabQuestion => Boolean(q))

  // Mostramos solo 2 preguntas por vez; al elegir una aparece la siguiente.
  const pending = questions.filter((q) => !asked.includes(q.id))
  const visibleQuestions = pending.slice(0, 2)

  function handleAsk(q: LabQuestion) {
    setSpeech(q.answer)
    if (!asked.includes(q.id)) setAsked((prev) => [...prev, q.id])
  }

  const currentSpeech = started ? closingSpeech : speech

  // Con hotspot: al terminar las preguntas se enciende la pantalla azul.
  // Si el ámbito ya está resuelto, no se vuelve a ofrecer el juego.
  const hotspotActive = allAsked && !!gameHotspot && !started && !completed

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

      {/* Historial de la entrevista: botón cuadrado con puntas redondas,
          fijo en la esquina inferior derecha de la pantalla. */}
      <button
        type="button"
        onClick={() => setShowHistory(true)}
        aria-label="Ver historial de la entrevista"
        title="Ver historial de la entrevista"
        className="absolute bottom-4 right-4 z-40 flex size-16 items-center justify-center rounded-xl border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-8"
          aria-hidden="true"
        >
          <path d="M4 4h16v12H9l-4 4v-4H4z" />
          <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {showHistory ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowHistory(false)}
        >
          <div
            role="dialog"
            aria-label="Historial de la entrevista"
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.92)] p-4"
            style={{
              borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
              boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
            }}
          >
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <p className="font-pixel text-[0.7rem] uppercase tracking-[0.25em] neon-cyan">
                Registro de la entrevista
              </p>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                aria-label="Cerrar historial"
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {transcript.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground">
                  Todavía no le hiciste ninguna pregunta a {speaker}.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {transcript.map((q) => (
                    <li
                      key={q.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-[var(--neon-cyan)]/25 bg-[oklch(0.08_0.04_264/0.6)] p-3"
                    >
                      <p className="font-pixel text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                        Vos
                      </p>
                      <p className="font-mono text-sm leading-snug text-foreground/90">
                        {q.question}
                      </p>
                      <p className="font-pixel text-[0.6rem] uppercase tracking-wide neon-cyan">
                        {speaker}
                      </p>
                      <p className="whitespace-pre-line font-mono text-sm leading-snug text-foreground/70">
                        {q.answer}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {/* Escenario: la imagen queda fija y el diálogo va superpuesto adentro */}
        <div
          className="relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          {started && framedGame && renderGame ? (
            <div className="relative">
              {/* Espaciador invisible: le da al recuadro EXACTAMENTE el mismo
                  tamaño que el retrato, para que el juego se vea con el mismo
                  marco y haya consistencia visual con las entrevistas. */}
              <Image
                src={image}
                alt=""
                aria-hidden
                width={960}
                height={960}
                className="max-h-[92vh] w-auto rounded-[1rem] object-contain opacity-0"
              />
              <div className="absolute inset-0 flex">
                {renderGame({
                  exit: () => setStarted(false),
                  complete: markCompleted,
                })}
              </div>
            </div>
          ) : (
          <>
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
                {gameHotspot.preview ? (
                  <span
                    className="flex size-full animate-pulse"
                    style={{
                      clipPath: gameHotspot.clipPath,
                      backgroundImage: `url(${gameHotspot.preview.image})`,
                      backgroundSize: gameHotspot.preview.backgroundSize,
                      backgroundPosition: gameHotspot.preview.backgroundPosition,
                    }}
                  />
                ) : (
                  <span
                    className="flex size-full animate-pulse flex-col items-start gap-0.5 bg-[linear-gradient(135deg,#2a5cff_0%,#0a36e8_45%,#0629b8_100%)] p-1 font-pixel text-[0.45rem] leading-none text-white/90"
                    style={{ clipPath: gameHotspot.clipPath }}
                  >
                    :(
                    <span className="h-px w-2/3 bg-white/40" />
                    <span className="h-px w-1/2 bg-white/30" />
                  </span>
                )}
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

            {/* Opciones (aparecen debajo del diálogo), en 2 columnas.
                Si el ámbito ya está resuelto, no se muestran: solo la frase
                genérica y el registro (botón de logs). */}
            {!started && !completed ? (
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
          </>
          )}
        </div>
      </div>

      {/* Juego NO enmarcado: overlay a pantalla completa (p. ej. CEO). */}
      {started && !framedGame && renderGame
        ? renderGame({ exit: () => setStarted(false), complete: markCompleted })
        : null}
    </main>
  )
}
