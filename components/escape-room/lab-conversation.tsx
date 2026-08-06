"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { DONE_KEY_PREFIX } from "@/lib/presence/types"
import { LAB_COLORS } from "./floor-plan"
import { Typewriter } from "./typewriter"

export type LabQuestion = {
  id: string
  question: string
  answer: string
  /**
   * Frases textuales del `answer` que se resaltan en el registro de la
   * entrevista como pistas para encontrar al culpable. Coincidencia literal
   * (sin distinguir mayúsculas).
   */
  highlights?: string[]
}

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
   * Contraseña que entrega el juego de este ámbito. Si se define, se muestra al
   * final del registro de la entrevista una vez que el ámbito está resuelto.
   */
  password?: string
  /**
   * Si es true, el botón "Volver" (al plano) se muestra SIEMPRE, incluso dentro
   * del juego (no se aplica el bloqueo de sala). Se usa en CIDI (juego final).
   */
  exitAlwaysAvailable?: boolean
  /**
   * Si es true y ya se hizo la entrevista una vez (ya se entró al juego), al
   * volver a entrar se saltea la entrevista y se va directo al juego.
   */
  resumeGameOnReturn?: boolean
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

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ POSICIÓN DEL GLOBO DE DIÁLOGO — editá esto a mano para ajustar cada uno.  │
// │  · top:  altura del globo (distancia desde arriba de la imagen). Podés    │
// │         usar % (ej. "6%", "12%") o píxeles (ej. "80px"). Más grande = más │
// │         abajo.                                                            │
// │  · side: de qué lado va el globo. "right" cuando el personaje está a la   │
// │         izquierda; "left" cuando el personaje está a la derecha (Avril).  │
// └─────────────────────────────────────────────────────────────────────────┘
const BUBBLE_LAYOUT: Record<string, { top: string; side: "left" | "right" }> = {
  AMI: { top: "20%", side: "right" },
  HMP: { top: "20%", side: "right" },
  CEO: { top: "20%", side: "right" },
  LUM: { top: "20%", side: "right" },
  CIDI: { top: "20%", side: "left" },
}
const DEFAULT_BUBBLE = { top: "6%", side: "right" as const }

// Color de fondo del globo. El último número (/ 0.6) es la TRANSPARENCIA:
// más bajo = se ve más el fondo detrás; más alto (hasta 1) = más opaco.
const BUBBLE_BG = "oklch(0.1 0.04 264 / 0.6)"

const DEFAULT_COMPLETED_SPEECH =
  "Este sector ya quedó resuelto. No tengo nada nuevo para contarte, " +
  "pero podés revisar el registro de la entrevista cuando quieras."

/** Escapa un texto para usarlo como literal dentro de una expresión regular. */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Devuelve el texto con las frases-pista resaltadas. Las coincidencias son
 * literales y sin distinguir mayúsculas; las frases más largas tienen prioridad
 * para evitar que una corta parta a una más larga.
 */
function highlightClues(text: string, clues?: string[]): ReactNode {
  const phrases = (clues ?? []).map((c) => c.trim()).filter(Boolean)
  if (phrases.length === 0) return text
  const pattern = phrases
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|")
  const re = new RegExp(`(${pattern})`, "gi")
  return text.split(re).map((part, i) =>
    // Con un único grupo de captura, los índices impares son las coincidencias.
    i % 2 === 1 ? (
      <mark
        key={i}
        className="rounded-[3px] bg-[#facc15]/25 px-0.5 font-semibold text-[#fde047]"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

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
    password,
    exitAlwaysAvailable,
    resumeGameOnReturn,
    gameHotspot,
    framedGame,
  } = config

  const image = imageForAcronym(acronym)
  const color = LAB_COLORS[acronym] ?? "var(--neon-cyan)"

  // Posición del globo de este ámbito (editable en BUBBLE_LAYOUT, arriba).
  const bubble = BUBBLE_LAYOUT[acronym] ?? DEFAULT_BUBBLE
  const bubbleOnRight = bubble.side === "right"

  // Diálogo actual que "dice" el personaje de la imagen.
  const [speech, setSpeech] = useState<string>(greeting)
  const [asked, setAsked] = useState<string[]>([])
  const [started, setStarted] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  // `completed` = el ámbito ya fue resuelto en una visita anterior.
  const [completed, setCompleted] = useState(false)
  // `lockedIn` = el equipo ya entró a un juego. Desde ese momento no se puede
  // salir de la sala (se oculta "Volver") hasta completar el ámbito.
  const [lockedIn, setLockedIn] = useState(false)
  // `speechDone` = el diálogo actual ya terminó de "escribirse" en pantalla.
  // Las preguntas y el inicio del juego solo aparecen cuando está en true, así
  // los chicos tienen que esperar a que el texto se revele (y leerlo).
  const [speechDone, setSpeechDone] = useState(false)

  const doneKey = `${DONE_KEY_PREFIX}${acronym}`
  // Marca de que la entrevista ya se hizo (se entró al juego) al menos una vez.
  const seenKey = `escape-room-seen-${acronym}`

  // Al entrar: si este ámbito ya está resuelto, no repetimos toda la entrevista.
  // Damos por hechas todas las preguntas (para que el registro quede completo),
  // mostramos una frase genérica y ocultamos las preguntas y el juego.
  // Si no está resuelto pero ya se hizo la entrevista y el ámbito lo permite,
  // entramos directo al juego (sin repetir las preguntas).
  useEffect(() => {
    try {
      if (localStorage.getItem(doneKey)) {
        setCompleted(true)
        setAsked(questions.map((q) => q.id))
        setSpeech(completedSpeech ?? DEFAULT_COMPLETED_SPEECH)
      } else if (resumeGameOnReturn && localStorage.getItem(seenKey)) {
        setAsked(questions.map((q) => q.id))
        setStarted(true)
        setLockedIn(true)
      }
    } catch {
      /* noop */
    }
  }, [doneKey, seenKey, questions, completedSpeech, resumeGameOnReturn])

  // Entrar a un juego: además de iniciarlo, bloquea la salida de la sala y deja
  // registrado que la entrevista ya se hizo (para poder reentrar directo).
  function startGame() {
    setStarted(true)
    setLockedIn(true)
    try {
      localStorage.setItem(seenKey, "1")
    } catch {
      /* noop */
    }
  }

  // Marca el ámbito como resuelto (lo llama el juego al ganar).
  function markCompleted() {
    try {
      localStorage.setItem(doneKey, "1")
    } catch {
      /* noop */
    }
    setCompleted(true)
  }

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

  // Cada vez que cambia el diálogo (saludo, respuesta, cierre) se vuelve a
  // "escribir" desde cero: reseteamos el flag hasta que el Typewriter avise.
  useEffect(() => {
    setSpeechDone(false)
  }, [currentSpeech])

  // Con hotspot: al terminar las preguntas se enciende la pantalla azul.
  // Si el ámbito ya está resuelto, no se vuelve a ofrecer el juego. Solo tras
  // leerse el diálogo completo (speechDone).
  const hotspotActive =
    allAsked && !!gameHotspot && !started && !completed && speechDone

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

      {/* Volver: se oculta al entrar a un juego. No se puede salir de la sala
          hasta completar el ámbito (reaparece una vez resuelto). En ámbitos con
          `exitAlwaysAvailable` (CIDI) se muestra siempre. */}
      {!lockedIn || completed || exitAlwaysAvailable ? (
        <Link
          href="/plano"
          className="absolute right-4 top-4 z-40 rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
        >
          Volver
        </Link>
      ) : null}

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
                        {highlightClues(q.answer, q.highlights)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Contraseña encontrada: solo si el ámbito ya está resuelto. */}
              {completed && password ? (
                <div className="mt-3 rounded-lg border-2 border-[var(--neon-green)]/60 bg-[oklch(0.1_0.05_264/0.7)] p-3 text-center">
                  <p className="font-pixel text-[0.6rem] uppercase tracking-[0.25em] text-white/60">
                    Contraseña encontrada
                  </p>
                  <p className="mt-1 font-pixel text-2xl tracking-[0.3em] text-[var(--neon-green)]">
                    {password}
                  </p>
                </div>
              ) : null}
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
                onClick={startGame}
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

            {/* Globo de diálogo del personaje, a su lado (estilo visual novel /
                Corazón de Melón). Se ubica del lado libre del retrato y la
                colita apunta hacia el personaje. El texto se escribe de a poco. */}
            <div
              className={`absolute z-20 ${
                bubbleOnRight
                  ? "left-[34%] right-[2.5%] sm:left-[36%]"
                  : "left-[2.5%] right-[34%] sm:right-[36%]"
              }`}
              style={{ top: bubble.top }}
            >
              <div
                className="relative rounded-2xl border-2 border-[var(--neon-cyan)]/55 px-4 py-3 shadow-[0_0_26px_color-mix(in_oklch,var(--neon-cyan)_28%,transparent)] backdrop-blur-sm"
                style={{ backgroundColor: BUBBLE_BG }}
              >
                {/* Colita del globo: dos triángulos (contorno + relleno) que
                    apuntan hacia el personaje. Si el globo está a la derecha,
                    el personaje está a la izquierda y la colita apunta a la
                    izquierda (y al revés). */}
                {bubbleOnRight ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute -left-[15px] top-9 h-0 w-0 border-y-[11px] border-r-[15px] border-y-transparent"
                      style={{
                        borderRightColor:
                          "color-mix(in oklch, var(--neon-cyan) 55%, transparent)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -left-[10px] top-[38px] h-0 w-0 border-y-[8px] border-r-[11px] border-y-transparent"
                      style={{ borderRightColor: BUBBLE_BG }}
                    />
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute -right-[15px] top-9 h-0 w-0 border-y-[11px] border-l-[15px] border-y-transparent"
                      style={{
                        borderLeftColor:
                          "color-mix(in oklch, var(--neon-cyan) 55%, transparent)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -right-[10px] top-[38px] h-0 w-0 border-y-[8px] border-l-[11px] border-y-transparent"
                      style={{ borderLeftColor: BUBBLE_BG }}
                    />
                  </>
                )}

                <p className="mb-1 font-pixel text-[0.7rem] uppercase tracking-[0.25em] neon-cyan">
                  {speaker}
                </p>
                <Typewriter
                  key={currentSpeech}
                  text={currentSpeech}
                  onDone={() => setSpeechDone(true)}
                  className="max-h-[52vh] overflow-y-auto font-mono text-[0.9rem] leading-snug text-foreground/95 sm:text-[0.95rem]"
                />
              </div>
            </div>
          </div>

          {/* Opciones del jugador, pegadas al fondo de la imagen. */}
          <div className="absolute inset-x-2 bottom-2 flex max-h-[60%] flex-col justify-end gap-2">
            {/* Opciones (en 2 columnas).
                Si el ámbito ya está resuelto, no se muestran: solo la frase
                genérica y el registro (botón de logs). Aparecen recién cuando
                el diálogo terminó de escribirse (speechDone), para forzar la
                lectura. */}
            {!started && !completed && speechDone ? (
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
                      onClick={startGame}
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
