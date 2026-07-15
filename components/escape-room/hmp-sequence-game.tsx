"use client"

import { useState } from "react"
import Link from "next/link"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO HMP — Secuencia de realidad virtual
 * El sistema de VR quedó desconfigurado: hay que reproducir la secuencia de
 * símbolos en el orden mostrado. La secuencia está SIEMPRE a la vista (no hay
 * que memorizar nada): es el desafío más simple posible, temático de HMP.
 * Tocás los símbolos en orden; si te equivocás, se reinicia.
 * ---------------------------------------------------------------------- */

const HMP_VIOLET = "oklch(0.62 0.25 300)"

// Paleta de símbolos disponibles, cada uno con su color para leerlos fácil.
const GLYPHS = [
  { char: "▲", color: "var(--neon-cyan)" },
  { char: "●", color: "var(--neon-pink)" },
  { char: "■", color: "var(--neon-green)" },
  { char: "◆", color: "var(--neon-blue)" },
]

const colorFor = (char: string) =>
  GLYPHS.find((g) => g.char === char)?.color ?? HMP_VIOLET

// Secuencia objetivo que hay que reproducir en orden.
const TARGET = ["◆", "▲", "●", "■", "▲"]

export function HmpSequenceGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al completar la secuencia, para marcar el ámbito como resuelto. */
  onWin?: () => void
}) {
  // Cantidad de símbolos correctos ingresados hasta ahora (siempre consecutivos).
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(false)
  const [won, setWon] = useState(false)

  function tap(char: string) {
    if (won) return
    if (char === TARGET[progress]) {
      const next = progress + 1
      setError(false)
      setProgress(next)
      if (next === TARGET.length) {
        setWon(true)
        onWin?.()
      }
    } else {
      // Símbolo equivocado: se reinicia la secuencia.
      setError(true)
      setProgress(0)
    }
  }

  function reset() {
    setProgress(0)
    setError(false)
  }

  return (
    <div
      className="scanlines relative flex size-full flex-col gap-3 overflow-hidden rounded-[1rem] p-4 text-white sm:p-6"
      style={{ backgroundColor: "oklch(0.15 0.09 300)" }}
    >
      {/* Salir: vuelve a la conversación sin perder el avance del ámbito */}
      {onExit && !won ? (
        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border-2 border-white/50 bg-black/30 px-4 py-1.5 font-pixel text-[0.95rem] text-white transition-colors hover:bg-white hover:text-[oklch(0.15_0.09_300)]"
          >
            Salir
          </button>
        </div>
      ) : null}

      {/* Zona con scroll interno que centra el contenido en la pantalla. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center">
          {won ? (
            /* ------------------------- PANTALLA DE VICTORIA ------------------------- */
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 rounded-xl border-4 border-[var(--neon-green)]/70 bg-[oklch(0.1_0.05_264/0.9)] p-8 text-center shadow-[0_0_40px_color-mix(in_oklch,var(--neon-green)_40%,transparent)]">
              <p className="font-pixel text-[2rem] text-[var(--neon-green)]">
                SECUENCIA SINCRONIZADA
              </p>
              <p className="font-mono text-[1.05rem] leading-relaxed text-foreground/95">
                Los cascos de realidad virtual volvieron a coincidir con las
                terminales. El pendrive recuperó el fragmento del ámbito HMP.
              </p>
              <Link
                href="/plano"
                className="rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-2 font-pixel text-[0.95rem] text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
              >
                Volver al plano
              </Link>
            </div>
          ) : (
            /* --------------------------- PANTALLA DEL JUEGO --------------------------- */
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-white">
              <div className="text-center">
                <p className="font-pixel text-[1.05rem] uppercase tracking-widest">
                  Secuencia VR // HMP
                </p>
                <p className="mt-1 font-mono text-[0.95rem] text-white/70">
                  Sistema de realidad virtual desconfigurado
                </p>
              </div>

              <p className="max-w-xl text-center font-mono text-[1.05rem] leading-relaxed text-white/90">
                Reproducí la secuencia tocando los símbolos en el orden mostrado.
                Si te equivocás, la secuencia se reinicia.
              </p>

              {/* Secuencia objetivo (siempre visible). Se encienden los que ya
                  ingresaste correctamente. */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {TARGET.map((char, i) => {
                  const done = i < progress
                  const color = colorFor(char)
                  return (
                    <span
                      key={i}
                      className="flex size-14 items-center justify-center rounded-xl border-2 text-[2rem] transition-all sm:size-16"
                      style={
                        done
                          ? {
                              color,
                              borderColor: color,
                              backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`,
                              boxShadow: `0 0 14px ${color}`,
                            }
                          : {
                              color: "rgba(255,255,255,0.5)",
                              borderColor: "rgba(255,255,255,0.18)",
                            }
                      }
                    >
                      {char}
                    </span>
                  )
                })}
              </div>

              <p className="font-pixel text-[0.9rem] tracking-widest text-white/70">
                {progress} / {TARGET.length}
              </p>

              {/* Botonera de símbolos */}
              <div className="flex flex-wrap justify-center gap-3">
                {GLYPHS.map((g) => (
                  <button
                    key={g.char}
                    type="button"
                    onClick={() => tap(g.char)}
                    aria-label={`Símbolo ${g.char}`}
                    className="flex size-16 items-center justify-center rounded-xl border-2 text-[2rem] transition-transform hover:scale-105 active:scale-95"
                    style={{
                      color: g.color,
                      borderColor: `color-mix(in oklch, ${g.color} 60%, transparent)`,
                      backgroundColor: `color-mix(in oklch, ${g.color} 12%, transparent)`,
                    }}
                  >
                    {g.char}
                  </button>
                ))}
              </div>

              <div className="flex min-h-[1.5rem] flex-col items-center gap-2">
                {error ? (
                  <p className="font-pixel text-[0.82rem] text-red-400">
                    SECUENCIA INCORRECTA — empezá de nuevo
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md border border-white/40 px-3 py-1 font-pixel text-[0.8rem] text-white/80 transition-colors hover:bg-white/10"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
