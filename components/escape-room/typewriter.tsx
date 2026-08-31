"use client"

import { useEffect, useMemo, useRef, useState } from "react"

/**
 * Efecto "máquina de escribir" estilo Undertale / visual novel.
 *
 * El texto se revela de a poco (carácter por carácter) y el autor controla
 * TODO el formato con dos marcas dentro del texto del diálogo:
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  \n     → salto de renglón DENTRO del mismo globo.                      │
 *  │  \n\n   → globo NUEVO: el globo actual se borra y sigue el siguiente.   │
 *  │  [2s]   → cuánto se queda ese globo YA escrito antes de continuar.      │
 *  │           Va al principio del globo. Se puede usar [2s], [1500ms], [3]. │
 *  │           (un número solo = segundos). Si no se pone, dura lo default.  │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 * Ejemplo:
 *   "Hola.\n¿Cómo estás?\nSoy Mica.\n\n[2s]¿Buscás al culpable?\nYo te ayudo."
 *   → Globo 1 (3 renglones), se borra, → Globo 2 (2 renglones) que se queda 2s.
 */

// Ritmo del tipeo. Ajustables a mano si hace falta.
const TYPE_SPEED_MS = 45 // ms por carácter
const LINE_PAUSE_MS = 500 // pausa entre renglones (\n) del mismo globo

// Respiro extra DESPUÉS de escribir un signo de puntuación (se suma como la
// pausa que antes hacía solo la coma). Los signos de cierre (. ? !) frenan un
// poco más que la coma. Editá o agregá caracteres a gusto.
const PUNCTUATION_PAUSE_MS: Record<string, number> = {
  ",": 300,
  ";": 350,
  ":": 350,
  ".": 400,
  "?": 500,
  "!": 500,
}
// Cuánto se queda un globo ya escrito antes de borrarse/seguir, si no se
// especificó una duración con [Ns].
const DEFAULT_HOLD_MS = 800

type Bubble = { lines: string[]; hold: number }

/** Convierte el texto del diálogo en la lista de globos, cada uno con sus
 *  renglones y su duración. */
export function parseDialogue(text: string): Bubble[] {
  return text
    .split(/\n\s*\n/) // globos: separados por una línea en blanco
    .map((raw) => {
      let hold = DEFAULT_HOLD_MS
      // Duración opcional [2s] / [1500ms] / [3]. Se extrae y se saca del texto.
      const withoutDur = raw.replace(
        /\[(\d+)\s*(ms|s)?\]/i,
        (_match, num: string, unit?: string) => {
          const value = parseInt(num, 10)
          hold = unit?.toLowerCase() === "ms" ? value : value * 1000
          return ""
        },
      )
      const lines = withoutDur
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      return { lines, hold }
    })
    .filter((bubble) => bubble.lines.length > 0)
}

export function Typewriter({
  text,
  className,
  onDone,
}: {
  text: string
  className?: string
  /** Se llama cuando terminó el ÚLTIMO globo (con su duración incluida). */
  onDone?: () => void
}) {
  const bubbles = useMemo(() => parseDialogue(text), [text])
  // Texto visible de cada renglón del globo actual (se va llenando de a poco).
  const [shown, setShown] = useState<string[]>([])
  const [typing, setTyping] = useState(true)

  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (bubbles.length === 0) {
      setShown([])
      setTyping(false)
      onDoneRef.current?.()
      return
    }

    let bubbleIndex = 0
    let lineIndex = 0
    let charIndex = 0
    let timer = 0
    let cancelled = false

    const startBubble = () => {
      if (cancelled) return
      setShown(bubbles[bubbleIndex].lines.map(() => ""))
      setTyping(true)
      lineIndex = 0
      charIndex = 0
      timer = window.setTimeout(typeChar, TYPE_SPEED_MS)
    }

    const typeChar = () => {
      if (cancelled) return
      const { lines, hold } = bubbles[bubbleIndex]
      const line = lines[lineIndex]

      if (charIndex < line.length) {
        charIndex += 1
        const slice = line.slice(0, charIndex)
        setShown((prev) => {
          const next = prev.slice()
          next[lineIndex] = slice
          return next
        })
        const justTyped = line[charIndex - 1]
        timer = window.setTimeout(
          typeChar,
          PUNCTUATION_PAUSE_MS[justTyped] ?? TYPE_SPEED_MS,
        )
      } else if (lineIndex < lines.length - 1) {
        lineIndex += 1
        charIndex = 0
        timer = window.setTimeout(typeChar, LINE_PAUSE_MS)
      } else {
        // Globo terminado: se queda `hold` ms y después sigue.
        setTyping(false)
        if (bubbleIndex < bubbles.length - 1) {
          timer = window.setTimeout(() => {
            bubbleIndex += 1
            startBubble()
          }, hold)
        } else {
          // Último globo: queda en pantalla y se habilitan las opciones.
          timer = window.setTimeout(() => onDoneRef.current?.(), hold)
        }
      }
    }

    startBubble()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [bubbles])

  // Renglón que se está escribiendo: ahí va el cursor.
  const lastVisible = shown.reduce((acc, line, i) => (line ? i : acc), -1)

  return (
    <div className={className}>
      {/* Texto completo para lectores de pantalla (sin la animación). */}
      <span className="sr-only">{text}</span>

      <span aria-hidden="true">
        {shown.map((line, i) =>
          line ? (
            <p key={i} className={i > 0 ? "mt-1" : undefined}>
              <span className="whitespace-pre-line">{line}</span>
              {typing && i === lastVisible ? (
                <span className="ml-0.5 inline-block animate-pulse">▍</span>
              ) : null}
            </p>
          ) : null,
        )}
      </span>
    </div>
  )
}
