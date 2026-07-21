"use client"

import { useState } from "react"
import Link from "next/link"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO HMP — Módulo de realidad virtual (dial de letras)
 * El módulo VR se reinició y muestra letras cambiadas. Hay que ajustar cada
 * una de las 5 casillas con las flechas ▲/▼ hasta formar la PALABRA REQUERIDA
 * (una palabra de informática de 5 letras, elegida al azar) y presionar ENVIAR.
 * No se muestra la lista de palabras posibles: solo la palabra objetivo.
 * Estética: tinta negra sobre papel vintage (Courier), tamaños calcados del
 * juego del AMI para mantener consistencia dentro del recuadro.
 * ---------------------------------------------------------------------- */

const PASSWORD = "SINCRO"

// Paleta "papel + tinta" para el look de máquina de escribir sobre papel viejo.
const PAPER = "#efe6cf"
const PAPER_PANEL = "#e4d8ba"
const INK = "#2a2118"
// Verde de "acierto": resalta la casilla cuando la letra está en su posición.
const GREEN = "#2f7d32"
const TYPEWRITER = '"Courier New", Courier, monospace'

// Textura de grano sutil (SVG inline) que se superpone al papel.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

// Palabras de informática de 5 letras (en español, sin tildes ni Ñ).
// La palabra requerida se elige al azar de esta lista; NO se muestra la lista.
const WORDS = [
  "BUCLE", "CABLE", "CAMPO", "CANAL", "CELDA", "CIFRA", "CLAVE", "COPIA",
  "DATOS", "DISCO", "FIBRA", "ICONO", "LINEA", "LOGIN", "MALLA", "MARCO",
  "MODEM", "MODOS", "MOVIL", "NODOS", "PILAS", "PIXEL", "PLACA", "RATON",
  "REDES", "RELOJ", "ROBOT", "SITIO", "TABLA", "TEXTO", "TRAMA", "TRAZA",
  "VIRUS", "ANCHO", "ORDEN",
]

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

// Cantidad de letras disponibles en cada dial: las de la palabra + señuelos.
// Acotado a propósito: suficiente para confundir, pero no tantas como para que
// descubrir la palabra sea difícil (no se usa todo el abecedario).
const POOL_SIZE = 10

/** Devuelve una copia barajada del array (Fisher-Yates). */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pool de letras compartido por los diales: TODAS las letras de la palabra +
 *  señuelos al azar hasta POOL_SIZE, ordenado alfabéticamente. */
function buildPool(word: string): string[] {
  const letters = new Set(word.split(""))
  for (const c of shuffled(ALPHABET)) {
    if (letters.size >= POOL_SIZE) break
    letters.add(c)
  }
  return Array.from(letters).sort()
}

type Puzzle = { target: string; pool: string[]; reels: number[] }

/** Elige una palabra al azar, arma su pool acotado y desfasa cada dial para que
 *  arranque en una letra distinta de la correcta (siempre hay algo que ajustar). */
function makePuzzle(): Puzzle {
  const target = WORDS[Math.floor(Math.random() * WORDS.length)]
  const pool = buildPool(target)
  const reels = target.split("").map((ch) => {
    const correct = pool.indexOf(ch)
    let start = correct
    while (start === correct) start = Math.floor(Math.random() * pool.length)
    return start
  })
  return { target, pool, reels }
}

export function HmpSequenceGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al formar la palabra correcta, para marcar el ámbito como resuelto. */
  onWin?: () => void
}) {
  // La palabra, su pool acotado de letras y la posición de cada dial se generan
  // al azar al montar (el juego solo se monta en el cliente tras "Iniciar").
  const [puzzle, setPuzzle] = useState<Puzzle>(makePuzzle)
  const [error, setError] = useState(false)
  const [won, setWon] = useState(false)
  // Cartel de acceso previo: solo 2 integrantes van físicamente al HMP.
  const [entered, setEntered] = useState(false)
  // Aciertos por posición del ÚLTIMO intento (ENVIAR). Se limpia al mover un
  // dial: el verde solo aparece como resultado del intento, no en todo momento.
  const [feedback, setFeedback] = useState<boolean[] | null>(null)

  const { target, pool, reels } = puzzle
  const current = reels.map((idx) => pool[idx]).join("")

  function step(i: number, dir: 1 | -1) {
    if (won) return
    setError(false)
    setFeedback(null)
    setPuzzle((p) => ({
      ...p,
      reels: p.reels.map((v, idx) =>
        idx === i ? (v + dir + p.pool.length) % p.pool.length : v,
      ),
    }))
  }

  function submit() {
    if (won) return
    if (current === target) {
      setWon(true)
      onWin?.()
    } else {
      setError(true)
      setFeedback(reels.map((idx, i) => pool[idx] === target[i]))
    }
  }

  return (
    <div
      className="relative flex size-full flex-col gap-3 overflow-hidden rounded-[1rem] p-4 sm:p-6"
      style={{ backgroundColor: PAPER, color: INK, fontFamily: TYPEWRITER }}
    >
      {/* Grano de papel superpuesto (no bloquea clics). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: GRAIN, mixBlendMode: "multiply" }}
      />

      {/* Salir: vuelve a la conversación sin perder el avance del ámbito */}
      {onExit && !won ? (
        <div className="relative flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onExit}
            className="rounded-sm border-2 px-4 py-1.5 text-[0.95rem] font-bold uppercase tracking-widest transition-colors"
            style={{ borderColor: INK, color: INK }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = INK
              e.currentTarget.style.color = PAPER
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = INK
            }}
          >
            Salir
          </button>
        </div>
      ) : null}

      {/* Zona con scroll interno que centra el contenido en el papel. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center">
          {won ? (
            /* ------------------------- PANTALLA DE VICTORIA ------------------------- */
            <div
              className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 rounded-sm border-4 p-8 text-center"
              style={{ borderColor: INK }}
            >
              <p className="text-[2rem] font-bold uppercase tracking-[0.15em]">
                Módulo sincronizado
              </p>
              <p className="text-[1.05rem] leading-relaxed">
                El módulo de realidad virtual volvió a coincidir con las terminales.
                El pendrive recuperó el fragmento del ámbito HMP.
              </p>
              <div
                className="rounded-sm border-2 px-6 py-3"
                style={{ borderColor: INK, backgroundColor: PAPER_PANEL }}
              >
                <p className="text-[0.7rem] uppercase tracking-[0.35em] opacity-70">
                  Contraseña
                </p>
                <p className="text-3xl font-bold tracking-[0.35em]">{PASSWORD}</p>
              </div>
              <Link
                href="/plano"
                className="rounded-sm border-2 px-5 py-2 text-[0.95rem] font-bold uppercase tracking-widest transition-colors"
                style={{ borderColor: INK, color: INK }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = INK
                  e.currentTarget.style.color = PAPER
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = INK
                }}
              >
                Volver al plano
              </Link>
            </div>
          ) : !entered ? (
            /* --------------------------- CARTEL DE ACCESO --------------------------- */
            <div
              className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-sm border-4 p-8 text-center"
              style={{ borderColor: INK }}
            >
              <p className="text-[0.82rem] font-bold uppercase tracking-[0.35em] opacity-70">
                Aviso de acceso // HMP
              </p>

              <div
                className="flex size-24 items-center justify-center rounded-sm border-4 text-[3.5rem] font-bold leading-none"
                style={{ borderColor: INK }}
              >
                2
              </div>

              <p className="text-[1.5rem] font-bold uppercase leading-tight tracking-[0.08em]">
                Solo 2 integrantes van
                <br />
                físicamente al sector HMP
              </p>

              <p className="max-w-md text-[1.05rem] leading-relaxed">
                Elijan a <strong>2 participantes</strong> del equipo para dirigirse
                físicamente al HMP. El resto <strong>permanece en su lugar</strong> y
                acompaña desde acá. Cuando los 2 estén en el sector, continúen.
              </p>

              <button
                type="button"
                onClick={() => setEntered(true)}
                className="rounded-sm border-2 px-8 py-2.5 text-[1.05rem] font-bold uppercase tracking-[0.3em] transition-colors"
                style={{ borderColor: INK, color: INK }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = INK
                  e.currentTarget.style.color = PAPER
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = INK
                }}
              >
                Continuar
              </button>
            </div>
          ) : (
            /* --------------------------- PANTALLA DEL JUEGO --------------------------- */
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              <div>
                <p className="text-[1.05rem] font-bold uppercase tracking-[0.2em]">
                  Módulo de realidad virtual // HMP
                </p>
                <p className="text-[0.95rem] opacity-70">
                  VR-05 — reconfiguración de terminal léxica
                </p>
              </div>

              <p className="text-[1.05rem] leading-relaxed">
                El módulo se reinició con las letras cambiadas. Ajustá cada casilla
                con las flechas hasta formar la palabra correcta y presioná ENVIAR.
              </p>

              {/* Diagrama del módulo: marco con doble borde tipo máquina. */}
              <div className="rounded-sm border-2 p-1" style={{ borderColor: INK }}>
                <div
                  className="flex flex-col items-center gap-5 rounded-sm border p-5 sm:p-6"
                  style={{ borderColor: INK }}
                >
                  {/* Fila de casillas: ▲ / letra / ▼.
                      Al presionar ENVIAR, las posiciones acertadas se resaltan
                      en verde para ayudar a completar la palabra. El verde se
                      limpia al mover cualquier dial. */}
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {reels.map((idx, i) => {
                      const ok = feedback?.[i] ?? false
                      return (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <ArrowButton
                            dir="up"
                            onClick={() => step(i, 1)}
                            label={`Subir letra ${i + 1}`}
                          />
                          <div
                            className="flex h-16 w-12 items-center justify-center rounded-sm border-2 text-[2rem] font-bold transition-colors sm:h-20 sm:w-14"
                            style={{
                              borderColor: ok ? GREEN : INK,
                              backgroundColor: ok ? GREEN : PAPER_PANEL,
                              color: ok ? PAPER : INK,
                              boxShadow: "inset 0 3px 0 rgba(0,0,0,0.14)",
                            }}
                          >
                            {pool[idx]}
                          </div>
                          <ArrowButton
                            dir="down"
                            onClick={() => step(i, -1)}
                            label={`Bajar letra ${i + 1}`}
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* Botón ENVIAR */}
                  <button
                    type="button"
                    onClick={submit}
                    className="rounded-sm border-2 px-8 py-2.5 text-[1.05rem] font-bold uppercase tracking-[0.3em] transition-colors"
                    style={{ borderColor: INK, color: INK }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = INK
                      e.currentTarget.style.color = PAPER
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                      e.currentTarget.style.color = INK
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>

              <div className="min-h-[1.5rem]">
                {error ? (
                  <p className="text-[0.9rem] font-bold uppercase tracking-widest">
                    Palabra incorrecta — seguí ajustando las casillas
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Botón de flecha (▲/▼) con el look tinta-sobre-papel. */
function ArrowButton({
  dir,
  onClick,
  label,
}: {
  dir: "up" | "down"
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-sm border-2 text-[1rem] font-bold leading-none transition-colors sm:size-10"
      style={{ borderColor: INK, color: INK }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = INK
        e.currentTarget.style.color = PAPER
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent"
        e.currentTarget.style.color = INK
      }}
    >
      {dir === "up" ? "▲" : "▼"}
    </button>
  )
}
