"use client"

import { useState } from "react"
import Link from "next/link"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO AMI — Terminal bloqueada
 * Se resuelven 7 ecuaciones; cada resultado es el código ASCII de una letra.
 * Las 7 letras forman la contraseña que desbloquea la terminal.
 * ---------------------------------------------------------------------- */

const PASSWORD = "DECRYPT"

const EQUATIONS = [
  { id: "e1", label: "Letra 1", expression: "(8 × 8) + (2 × 2)", result: 68 }, // D
  { id: "e2", label: "Letra 2", expression: "(8 × 8) + 5", result: 69 }, // E
  { id: "e3", label: "Letra 3", expression: "(9 × 9) − 14", result: 67 }, // C
  { id: "e4", label: "Letra 4", expression: "(100 ÷ 10) × 8 + 2", result: 82 }, // R
  { id: "e5", label: "Letra 5", expression: "(9 × 9) + 8", result: 89 }, // Y
  { id: "e6", label: "Letra 6", expression: "(4 × 4) × 5", result: 80 }, // P
  { id: "e7", label: "Letra 7", expression: "(10 × 10) − (4 × 4)", result: 84 }, // T
]

const ASCII_TABLE = Array.from({ length: 26 }, (_, i) => ({
  letter: String.fromCharCode(65 + i),
  code: 65 + i,
}))

export function AmiEquationsGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al resolver la terminal, para marcar el ámbito como completado. */
  onWin?: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState("")
  const [error, setError] = useState(false)
  const [won, setWon] = useState(false)
  const [showTable, setShowTable] = useState(false)

  function handleAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
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

          <p className="font-mono text-[1.05rem] leading-relaxed text-white/90">
            Resolvé las 7 ecuaciones. Cada resultado es el código ASCII de una
            letra. Las 7 letras, en orden, forman la contraseña que desbloquea
            la terminal.
          </p>

          {/* Ecuaciones con verificación del resultado numérico */}
          <ul className="flex flex-col gap-2">
            {EQUATIONS.map((eq) => {
              const value = (answers[eq.id] ?? "").trim()
              const isCorrect = value !== "" && Number(value) === eq.result
              const isWrong = value !== "" && !isCorrect
              return (
                <li
                  key={eq.id}
                  className="flex items-center gap-3 rounded-lg border border-white/25 bg-[#04125e]/60 px-3 py-2"
                >
                  <span className="w-28 shrink-0 whitespace-nowrap font-pixel text-[0.82rem] text-white/80">
                    {eq.label}
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

          {/* Ayuda: tabla ASCII */}
          <div>
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

          {/* Contraseña final */}
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <label className="font-pixel text-[0.82rem] uppercase text-white/90">
              Contraseña:
            </label>
            <input
              type="text"
              value={attempt}
              maxLength={PASSWORD.length}
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
        </div>
      </div>
    </div>
  )
}
