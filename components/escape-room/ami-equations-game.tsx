"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO AMI — Terminal bloqueada (3 niveles)
 * La contraseña está cifrada en 3 niveles. En cada nivel se resuelven unas
 * ecuaciones; cada resultado es el código ASCII de una letra. Al descifrar los
 * 3 niveles se arma la contraseña completa (DECRYPT) que desbloquea la terminal.
 * ---------------------------------------------------------------------- */

type Equation = { id: string; expression: string; result: number; letter: string }

// Los 3 niveles, con dificultad creciente en las expresiones. Las letras de
// todos los niveles, en orden, forman DECRYPT.
const LEVELS: { equations: Equation[] }[] = [
  // Nivel 1 — una multiplicación metida entre sumas y restas: hay que aplicar
  // el orden de operaciones antes de resolver de izquierda a derecha.
  {
    equations: [
      { id: "e1", expression: "6 × 7 + 18 + 10 − 2", result: 68, letter: "D" },
      { id: "e2", expression: "9 × 8 − 20 + 25 − 8", result: 69, letter: "E" },
      { id: "e3", expression: "5 × 12 + 14 − 9 + 2", result: 67, letter: "C" },
    ],
  },
  // Nivel 2 — entran los paréntesis y la división, junto al orden de operaciones.
  {
    equations: [
      { id: "e4", expression: "(12 + 8) × 4 + 10 − 8", result: 82, letter: "R" },
      { id: "e5", expression: "100 ÷ 4 × 3 + 20 − 6", result: 89, letter: "Y" },
    ],
  },
  // Nivel 3 — potencias combinadas con paréntesis y multiplicación.
  {
    equations: [
      { id: "e6", expression: "3³ + 6² + 4 × 5 − 3", result: 80, letter: "P" },
      { id: "e7", expression: "(4² + 5) × 4 + 2³ − 8", result: 84, letter: "T" },
    ],
  },
]

const LEVEL_COUNT = LEVELS.length

// Ecuaciones aplanadas, con el nivel al que pertenecen y su número global (1..7).
const NUMBERED = LEVELS.flatMap((lvl, levelIndex) =>
  lvl.equations.map((eq) => ({ ...eq, levelIndex })),
).map((eq, i) => ({ ...eq, num: i + 1 }))

// La contraseña final es la unión de todas las letras: DECRYPT.
const PASSWORD = NUMBERED.map((e) => e.letter).join("")

const ASCII_TABLE = Array.from({ length: 26 }, (_, i) => ({
  letter: String.fromCharCode(65 + i),
  code: 65 + i,
}))

// Esquina donde aparece la X de cerrar cada aviso: la 0 es la del cartel
// inicial y después va una por nivel. Hay que buscarla, así el cartel se lee
// en vez de cerrarse de memoria.
const CLOSE_CORNERS = [
  "bottom-3 right-3",
  "right-3 top-3",
  "bottom-3 left-3",
  "left-3 top-3",
]

export function AmiEquationsGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al resolver la terminal, para marcar el ámbito como completado. */
  onWin?: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [level, setLevel] = useState(0)
  // Los 3 niveles ya fueron descifrados: se habilita la contraseña final.
  const [decrypted, setDecrypted] = useState(false)
  const [levelError, setLevelError] = useState(false)
  const [attempt, setAttempt] = useState("")
  const [error, setError] = useState(false)
  const [won, setWon] = useState(false)
  const [showTable, setShowTable] = useState(false)
  // Cartel de arranque: se muestra apenas se abre la terminal.
  const [intro, setIntro] = useState(true)
  // Nivel recién descifrado (0..2) mientras se muestra el aviso; null = cerrado.
  const [notice, setNotice] = useState<number | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Al abrir la tabla (por el botón o por el término "código ASCII"), la
  // llevamos a la vista para que el cambio sea evidente.
  useEffect(() => {
    if (showTable) {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [showTable])

  const currentEquations = NUMBERED.filter((e) => e.levelIndex === level)
  const levelSolved = currentEquations.every((e) => {
    const v = (answers[e.id] ?? "").trim()
    return v !== "" && Number(v) === e.result
  })

  function handleAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setLevelError(false)
  }

  // Descifrar el nivel actual: si todas sus ecuaciones son correctas, avanza; si
  // era el último, habilita la contraseña final.
  function decryptLevel() {
    if (!levelSolved) {
      setLevelError(true)
      return
    }
    setLevelError(false)
    setNotice(level)
    if (level < LEVEL_COUNT - 1) {
      setLevel(level + 1)
    } else {
      setDecrypted(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (attempt.trim().toUpperCase() === PASSWORD) {
      setWon(true)
      onWin?.()
    } else {
      setError(true)
    }
  }

  return (
    <div className="scanlines relative flex size-full flex-col gap-3 overflow-hidden rounded-[1rem] bg-[#061a8f] p-4 text-white sm:p-6">
      {/* Cerrar: vuelve a la conversación sin perder el avance del ámbito */}
      {onExit && !won ? (
        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border-2 border-white/50 bg-[#04125e]/70 px-4 py-1.5 font-pixel text-[0.95rem] text-white transition-colors hover:bg-white hover:text-[#061a8f]"
          >
            Salir
          </button>
        </div>
      ) : null}

      {/* Zona con scroll interno que centra el contenido en la pantalla azul. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center">
      {won ? (
        /* ------------------------- PANTALLA DE VICTORIA ------------------------- */
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 rounded-xl border-4 border-[var(--neon-green)]/70 bg-[oklch(0.1_0.05_264/0.9)] p-8 text-center shadow-[0_0_40px_color-mix(in_oklch,var(--neon-green)_40%,transparent)]">
          <p className="font-pixel text-[2rem] text-[var(--neon-green)]">
            ACCESO CONCEDIDO
          </p>
          <p className="font-mono text-[1.05rem] leading-relaxed text-foreground/95">
            Contraseña <span className="font-bold tracking-[0.3em]">DECRYPT</span>{" "}
            aceptada. La terminal se desbloqueó y el pendrive recuperó el
            fragmento del ámbito AMI.
          </p>
          <Link
            href="/plano"
            className="rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-2 font-pixel text-[0.95rem] text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
          >
            Volver al plano
          </Link>
        </div>
      ) : (
        /* --------------------------- PANTALLA AZUL --------------------------- */
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-4">
              <span className="font-pixel text-[4rem] leading-none">:(</span>
              <div>
                <p className="font-pixel text-[1.05rem] uppercase tracking-widest">
                  Terminal bloqueada por la IA
                </p>
                <p className="font-mono text-[0.95rem] text-white/70">
                  AMI // ERROR 0x41534349 — SE REQUIERE CONTRASEÑA
                </p>
              </div>
            </div>
            {/* Indicador de nivel: texto + puntitos de progreso. */}
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[0.82rem] uppercase tracking-widest text-white/90">
                Nivel {Math.min(level + 1, LEVEL_COUNT)} / {LEVEL_COUNT}
              </span>
              <span className="flex gap-1.5">
                {Array.from({ length: LEVEL_COUNT }).map((_, i) => {
                  const done = decrypted || i < level
                  const current = !decrypted && i === level
                  return (
                    <span
                      key={i}
                      className="size-3 rounded-full border-2"
                      style={{
                        borderColor:
                          done || current ? "var(--neon-green)" : "rgba(255,255,255,0.3)",
                        backgroundColor: done ? "var(--neon-green)" : "transparent",
                      }}
                    />
                  )
                })}
              </span>
            </div>
          </div>

          <p className="font-mono text-[1.05rem] leading-relaxed text-white/90">
            La IA cifró la contraseña en {LEVEL_COUNT} niveles. En cada nivel,
            resolvé las ecuaciones: cada resultado es el{" "}
            <button
              type="button"
              onClick={() => setShowTable(true)}
              title="Ver la tabla ASCII"
              className="rounded bg-[var(--neon-cyan)]/15 px-1 font-bold text-[var(--neon-cyan)] underline decoration-dotted underline-offset-2 transition-colors hover:bg-[var(--neon-cyan)] hover:text-[#061a8f]"
            >
              código ASCII
            </button>{" "}
            de una letra. Al terminar los {LEVEL_COUNT} niveles vas a convertir esos
            códigos en letras para armar la contraseña.
          </p>

          {/* Aviso: el juego NO revela las letras; hay que anotar los resultados
              y convertirlos con la tabla ASCII para la contraseña final. */}
          <div className="flex items-start gap-3 rounded-lg border-2 border-[var(--neon-cyan)]/50 bg-[var(--neon-cyan)]/10 px-3 py-2">
            <span className="mt-0.5 shrink-0 font-pixel text-[0.7rem] uppercase tracking-[0.2em] text-[var(--neon-cyan)]">
              Importante
            </span>
            <p className="font-mono text-[0.95rem] leading-snug text-white/90">
              Anotá el resultado de cada ecuación: son los códigos ASCII de las
              letras. Al terminar los {LEVEL_COUNT} niveles vas a convertirlos con
              la tabla ASCII para escribir la contraseña final.
            </p>
          </div>

          {!decrypted ? (
            /* ------------------------- NIVEL ACTUAL ------------------------- */
            <>
              {/* Ecuaciones del nivel, con verificación del resultado numérico */}
              <ul className="flex flex-col gap-2">
                {currentEquations.map((eq) => {
                  const value = (answers[eq.id] ?? "").trim()
                  const isCorrect = value !== "" && Number(value) === eq.result
                  const isWrong = value !== "" && !isCorrect
                  return (
                    <li
                      key={eq.id}
                      className="flex items-center gap-3 rounded-lg border border-white/25 bg-[#04125e]/60 px-3 py-2"
                    >
                      <span className="w-28 shrink-0 whitespace-nowrap font-pixel text-[0.82rem] text-white/80">
                        Letra {eq.num}
                      </span>
                      <span className="flex-1 font-mono text-[1.05rem]">
                        {eq.expression} =
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={answers[eq.id] ?? ""}
                        onChange={(e) => handleAnswer(eq.id, e.target.value)}
                        className={`w-24 rounded-md border-2 bg-[#04125e] px-2 py-1 text-center font-mono text-[1.05rem] outline-none transition-colors ${
                          isCorrect
                            ? "border-[var(--neon-green)] text-[var(--neon-green)]"
                            : isWrong
                              ? "border-red-400 text-red-300"
                              : "border-white/40 text-white focus:border-white"
                        }`}
                      />
                      <span
                        className={`w-6 text-center font-pixel text-[1.05rem] ${
                          isCorrect ? "text-[var(--neon-green)]" : "text-white/20"
                        }`}
                      >
                        {isCorrect ? "✔" : "?"}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {/* Descifrar el nivel para avanzar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={decryptLevel}
                  className="rounded-md border-2 border-[var(--neon-cyan)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-[0.95rem] text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-[#061a8f]"
                >
                  {level < LEVEL_COUNT - 1 ? "Descifrar nivel" : "Descifrar último nivel"}
                </button>
                {levelError ? (
                  <p className="font-pixel text-[0.82rem] text-red-400">
                    Todavía hay resultados incorrectos en este nivel.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            /* --------------------- CONTRASEÑA FINAL --------------------- */
            <div className="flex flex-col gap-3 rounded-lg border-2 border-[var(--neon-green)]/50 bg-[oklch(0.1_0.05_264/0.6)] p-3">
              <p className="font-mono text-[1.05rem] leading-relaxed text-white/90">
                Descifraste los {LEVEL_COUNT} niveles. Convertí con la tabla ASCII
                cada uno de los {PASSWORD.length} resultados que anotaste y escribí
                la palabra final para desbloquear la terminal.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
                <label className="font-pixel text-[0.82rem] uppercase text-white/90">
                  Contraseña:
                </label>
                <input
                  type="text"
                  value={attempt}
                  maxLength={PASSWORD.length}
                  autoFocus
                  onChange={(e) => {
                    setAttempt(e.target.value.toUpperCase())
                    setError(false)
                  }}
                  className="w-64 rounded-md border-2 border-white/50 bg-[#04125e] px-3 py-2 text-center font-mono text-[1.35rem] tracking-[0.4em] text-white outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-[0.95rem] text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
                >
                  Desbloquear
                </button>
                {error ? (
                  <p className="w-full font-pixel text-[0.82rem] text-red-400">
                    ACCESO DENEGADO — contraseña incorrecta
                  </p>
                ) : null}
              </form>
            </div>
          )}

          {/* Ayuda: tabla ASCII (disponible en todos los niveles) */}
          <div ref={tableRef}>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="rounded-md border border-white/40 px-3 py-1 font-pixel text-[0.82rem] text-white/80 transition-colors hover:bg-white/10"
            >
              {showTable ? "Ocultar tabla ASCII" : "Ver tabla ASCII"}
            </button>
            {showTable ? (
              <div className="mt-2 grid grid-cols-5 gap-1 rounded-lg border border-white/25 bg-[#04125e]/60 p-2 font-mono text-[0.95rem] sm:grid-cols-7">
                {ASCII_TABLE.map(({ letter, code }) => (
                  <span key={letter} className="text-center text-white/85">
                    {letter}={code}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Avisos: tapan el juego hasta que los cierren con la X. */}
      {intro ? (
        <Notice
          title="Antes de empezar"
          corner={CLOSE_CORNERS[0]}
          onClose={() => setIntro(false)}
        >
          Tengan <strong>papel y lapicera</strong> a mano: van a necesitar anotar
          el resultado de cada ecuación. Son los códigos ASCII con los que se arma
          la contraseña final, y la terminal no los guarda.
        </Notice>
      ) : notice !== null ? (
        <Notice
          title={`Nivel ${notice + 1} descifrado`}
          corner={CLOSE_CORNERS[(notice + 1) % CLOSE_CORNERS.length]}
          onClose={() => setNotice(null)}
        >
          No se olviden de <strong>anotar los resultados</strong> de este nivel:
          son los códigos ASCII que van a necesitar para armar la contraseña
          final. La terminal no vuelve a mostrarlos.
        </Notice>
      ) : null}
    </div>
  )
}

/** Cartel emergente del juego (arranque y fin de cada nivel): recuerda anotar
 *  los resultados, porque el juego no los muestra de nuevo. Marco amarillo del
 *  ámbito AMI y X de cerrar en la esquina que le toque al aviso. */
function Notice({
  title,
  corner,
  onClose,
  children,
}: {
  title: string
  /** Clases de posición de la X (ver CLOSE_CORNERS). */
  corner: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020a3a]/85 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="ami-notice-title"
        className="relative w-full max-w-md rounded-xl border-4 border-[oklch(0.9_0.19_100)] bg-[#04125e] p-8 text-center shadow-[0_0_40px_oklch(0.9_0.19_100/0.35)]"
      >
        {/* La X cambia de esquina en cada aviso (CLOSE_CORNERS). */}
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Cerrar aviso"
          className={`absolute ${corner} flex size-9 items-center justify-center rounded-md border-2 border-[oklch(0.9_0.19_100)] font-pixel text-[0.95rem] text-[oklch(0.9_0.19_100)] transition-colors hover:bg-[oklch(0.9_0.19_100)] hover:text-[#061a8f]`}
        >
          ✕
        </button>

        <div className="px-6">
          <p
            id="ami-notice-title"
            className="font-pixel text-[1.2rem] leading-relaxed text-[oklch(0.9_0.19_100)]"
          >
            {title}
          </p>
          <p className="mt-4 font-mono text-[1.05rem] leading-relaxed text-white/90">
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}
