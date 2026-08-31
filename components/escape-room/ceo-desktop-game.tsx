"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"

import { LAB_COLORS } from "./floor-plan"
import type { TeamData } from "./team-setup-screen"
import { Typewriter } from "./typewriter"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO CEO — Escritorio con archivo borrado
 * La compu se "prendió" y muestra un escritorio con 3 íconos:
 *  - Papelera: captura real de Windows con un archivo borrado. Al
 *    restaurarlo se abre un juego de ordenar a pantalla completa (estilo
 *    arcade retro, sin scroll): hay que arrastrar bloques de código
 *    mezclados hasta reconstruir una función de ordenamiento válida. Al
 *    lograrlo, hay que cerrar la ventana e ir a ver ADDE Labs.
 *  - ADDE Labs: la página de la empresa se ve rota (sin estilos, con
 *    imágenes caídas) hasta que se ordena el archivo de la papelera. Una
 *    vez recuperada, muestra el logo, info básica y un link para
 *    "descargar información extra": revela el último mensaje de la IA
 *    antes de corromperse y el código del fragmento.
 *  - Google Chrome: tiene un historial con dos páginas visitadas; cada
 *    una muestra su propia información al seleccionarla.
 * Las "ventanas" se recortan dentro de la pantalla del monitor de la
 * imagen, con barra de título estilo Windows (no macOS).
 * ---------------------------------------------------------------------- */

/**
 * Bloques de la función `ordenar()`: código JavaScript real (bubble sort
 * optimizado). Cada bloque es una o más líneas con su sangría ya puesta, así
 * que apilados en el orden correcto forman un archivo válido y ejecutable.
 * `label` explica en español qué hace ese bloque, para conectar la sintaxis
 * con su significado. El desafío es ordenarlos.
 */
type CodeBlock = { id: string; label: string; lines: string[] }

const CODE_BLOCKS: CodeBlock[] = [
  {
    id: "b1",
    label: "Definir la función que recibe la lista.",
    lines: ["function ordenar(lista) {"],
  },
  {
    id: "b2",
    label: "Suponer que hay desorden y repetir mientras lo haya.",
    lines: ["  let ordenada = false", "  while (!ordenada) {"],
  },
  {
    id: "b3",
    label: "Antes de cada pasada, darla por ordenada y recorrerla.",
    lines: [
      "    ordenada = true",
      "    for (let i = 0; i < lista.length - 1; i++) {",
    ],
  },
  {
    id: "b4",
    label: "Comparar cada número con su vecino de la derecha.",
    lines: ["      if (lista[i] > lista[i + 1]) {"],
  },
  {
    id: "b5",
    label: "Si están al revés, intercambiarlos y anotar el cambio.",
    lines: ["        intercambiar(lista, i, i + 1)", "        ordenada = false"],
  },
  {
    id: "b6",
    label: "Cerrar los ciclos y devolver la lista ordenada.",
    lines: ["      }", "    }", "  }", "  return lista", "}"],
  },
]

// Ids en el orden correcto y un desorden inicial (derangement: ningún bloque
// arranca en su posición final, para que haya que mover todos).
const CORRECT_ORDER_IDS = CODE_BLOCKS.map((b) => b.id)
const SCRAMBLED_ORDER = ["b2", "b4", "b6", "b1", "b3", "b5"]
const BLOCKS_BY_ID = Object.fromEntries(CODE_BLOCKS.map((b) => [b.id, b]))

// Lista de ejemplo que "ordena" el algoritmo al ejecutarlo, y su resultado.
const SAMPLE_LIST = [5, 2, 9, 1, 7, 3]
const SORTED_LIST = [...SAMPLE_LIST].sort((a, b) => a - b)

type SortFrame = { arr: number[]; a: number; b: number; swapped: boolean }

/**
 * Reproduce el bubble sort sobre `input` y registra cada comparación (con qué
 * par se miró y si hubo intercambio), para animar la ejecución paso a paso.
 */
function buildSortFrames(input: number[]): SortFrame[] {
  const arr = [...input]
  const frames: SortFrame[] = []
  let ordenada = false
  while (!ordenada) {
    ordenada = true
    for (let i = 0; i < arr.length - 1; i++) {
      const swapped = arr[i] > arr[i + 1]
      if (swapped) {
        ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        ordenada = false
      }
      frames.push({ arr: [...arr], a: i, b: i + 1, swapped })
    }
  }
  return frames
}

// Coloreo de sintaxis estilo editor: cada tipo de token lleva su color.
const CODE_KEYWORDS = new Set(["function", "let", "while", "for", "if", "return", "else"])
const CODE_LITERALS = new Set(["true", "false", "const", "var", "null"])
const CODE_CALLABLES = new Set(["ordenar", "intercambiar"])

/** Devuelve la línea de código coloreada por tipo de token (keyword, número, etc.). */
function highlightCode(line: string, keyPrefix: string): React.ReactNode[] {
  const commentAt = line.indexOf("//")
  const code = commentAt >= 0 ? line.slice(0, commentAt) : line
  const comment = commentAt >= 0 ? line.slice(commentAt) : ""
  const nodes: React.ReactNode[] = []
  const tokenRe = /([A-Za-z_$][A-Za-z0-9_$]*|\d+|\s+|[^\sA-Za-z0-9_$]+)/g
  let m: RegExpExecArray | null
  let i = 0
  while ((m = tokenRe.exec(code))) {
    const t = m[0]
    let cls = "text-[#d4d4d4]"
    if (/^\d+$/.test(t)) cls = "text-[#b5cea8]"
    else if (/^\s+$/.test(t)) cls = ""
    else if (/^[A-Za-z_$]/.test(t)) {
      if (CODE_KEYWORDS.has(t)) cls = "text-[#c586c0]"
      else if (CODE_LITERALS.has(t)) cls = "text-[#569cd6]"
      else if (CODE_CALLABLES.has(t)) cls = "text-[#dcdcaa]"
      else cls = "text-[#9cdcfe]"
    }
    nodes.push(
      cls ? (
        <span key={`${keyPrefix}-${i++}`} className={cls}>
          {t}
        </span>
      ) : (
        t
      ),
    )
  }
  if (comment) {
    nodes.push(
      <span key={`${keyPrefix}-c`} className="text-[#6a9955]">
        {comment}
      </span>,
    )
  }
  return nodes
}

type HistoryId = "delete" | "fix"

// Código de 6 caracteres que se revela al recuperar la IA en VS Code. Es la
// contraseña de la "Capa 2 · Lógica" del juego final (cidi-final-game), así
// que tiene que coincidir exactamente con la de allá.
const FRAGMENT_CODE = "HACK3D"

// Contraseña que desbloquea VS Code. Se revela en ADDE Labs, dibujada dentro
// de LIBERAR.png (por eso el archivo conserva ese nombre). Es un código poco
// intuitivo a propósito: obliga a encontrarlo ahí y no se adivina de memoria.
const VSCODE_PASSWORD = "K7-NOVA"

// Posiciones de los íconos sobre Escritorio.png (en % de la imagen). Los
// cuatro están en una sola columna a la izquierda; cada área cubre el ícono
// más su etiqueta, como el rectángulo de selección de un escritorio real.
const ICONS = {
  papelera: { left: "3.11%", top: "1.91%", width: "7.18%", height: "17.21%" },
  vscode: { left: "1.50%", top: "23.59%", width: "10.35%", height: "20.83%" },
  chrome: { left: "1.08%", top: "46.55%", width: "11.18%", height: "17.43%" },
  labs: { left: "2.09%", top: "68.55%", width: "9.15%", height: "19.45%" },
}

type WindowKind = "papelera" | "labs" | "chrome" | "vscode" | null

/**
 * Línea de código con número, estilo editor. Las medidas van en cqw (ancho del
 * contenedor) porque el código se dibuja encima de VSCode_False.png: así la
 * tipografía escala junto con la imagen y siempre cae dentro del editor,
 * cualquiera sea el tamaño de la pantalla.
 */
function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-[1.5cqw]">
      <span className="w-[2cqw] shrink-0 select-none text-right text-[#6e7681]">
        {n}
      </span>
      <span className="whitespace-pre">{children}</span>
    </div>
  )
}

/**
 * Desafío del CEO: reconstruir la función `ordenar()`.
 *
 * En vez de pseudocódigo, se ensambla código JavaScript real arrastrando
 * bloques hasta armar un bubble sort válido, y se lo "ejecuta": si el orden
 * está bien, corre una animación que ordena una lista de barras y se da por
 * resuelto; si está mal, tira un error y marca los bloques fuera de lugar.
 *
 * Es autónomo: maneja su propio estado (orden, arrastre, animación) y solo
 * avisa al padre cuando queda resuelto (onSolved), que es lo que habilita
 * el resto del ámbito (ADDE Labs).
 */
type SortPhase = "editing" | "running" | "done"

function SortAlgorithmGame({
  solved,
  onSolved,
  onClose,
}: {
  solved: boolean
  onSolved: () => void
  onClose: () => void
}) {
  const [order, setOrder] = useState<string[]>(() =>
    solved ? CORRECT_ORDER_IDS : SCRAMBLED_ORDER,
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [phase, setPhase] = useState<SortPhase>(solved ? "done" : "editing")
  const [checked, setChecked] = useState(false)
  const [bars, setBars] = useState<number[]>(solved ? SORTED_LIST : SAMPLE_LIST)
  const [activePair, setActivePair] = useState<[number, number] | null>(null)
  const [status, setStatus] = useState("")

  const frames = useMemo(() => buildSortFrames(SAMPLE_LIST), [])
  const orderCorrect = order.every((id, i) => id === CORRECT_ORDER_IDS[i])
  const editable = phase === "editing"
  const maxBar = Math.max(...SAMPLE_LIST)

  // onSolved en un ref: así el efecto de animación no se reinicia si el padre
  // se re-renderiza y cambia la identidad de la función.
  const onSolvedRef = useRef(onSolved)
  useEffect(() => {
    onSolvedRef.current = onSolved
  }, [onSolved])

  // Animación de la ejecución: recorre los frames del bubble sort, resaltando
  // el par comparado; al terminar, deja la lista ordenada y marca resuelto.
  useEffect(() => {
    if (phase !== "running") return
    let idx = 0
    const id = window.setInterval(() => {
      if (idx >= frames.length) {
        window.clearInterval(id)
        setActivePair(null)
        setBars(SORTED_LIST)
        setStatus(`Lista ordenada: [${SORTED_LIST.join(", ")}]`)
        setPhase("done")
        onSolvedRef.current()
        return
      }
      const f = frames[idx]
      setBars(f.arr)
      setActivePair([f.a, f.b])
      setStatus(
        f.swapped
          ? `lista[${f.a}] > lista[${f.b}] → intercambiar`
          : `lista[${f.a}] ≤ lista[${f.b}] → queda igual`,
      )
      idx++
    }, 360)
    return () => window.clearInterval(id)
  }, [phase, frames])

  function moveBlock(from: number, to: number) {
    if (from === to) return
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setChecked(false)
  }

  function handleRun() {
    if (phase !== "editing") return
    if (!orderCorrect) {
      // Orden mal: marca los bloques (rojo/verde) y no ejecuta.
      setChecked(true)
      setStatus("")
      return
    }
    setChecked(false)
    setBars(SAMPLE_LIST)
    setActivePair(null)
    setStatus("")
    setPhase("running")
  }

  // Número de línea con el que arranca cada bloque, para numerar el archivo
  // entero de corrido como en un editor real.
  let lineCounter = 1

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background p-3 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0.1_0.04_264/0.9)_75%,oklch(0.08_0.04_264/0.97)_100%)]"
      />

      <div className="relative flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border-4 border-[var(--neon-cyan)]/70 bg-[oklch(0.1_0.04_264/0.94)] shadow-[0_0_45px_color-mix(in_oklch,var(--neon-cyan)_35%,transparent)]">
        {/* Encabezado */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-pixel text-xs uppercase tracking-[0.2em] neon-cyan sm:text-sm">
              ordenar.js · reconstruí el algoritmo
            </p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground sm:text-xs">
              Arrastrá los bloques (⠿) hasta armar la función, después tocá ▶ Ejecutar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border-2 border-[var(--neon-cyan)]/60 px-3 py-1.5 font-pixel text-[0.6rem] uppercase text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background sm:text-xs"
          >
            ✕ Salir
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 lg:grid-cols-[1.35fr_1fr]">
          {/* Editor: bloques de código arrastrables */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e]">
            <div className="flex shrink-0 items-center gap-2 border-b border-black/40 bg-[#2d2d2d] px-3 py-1.5">
              <span aria-hidden="true">📄</span>
              <span className="font-mono text-xs text-gray-200">ordenar.js</span>
            </div>
            <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2 sm:p-3">
              {order.map((id, i) => {
                const block = BLOCKS_BY_ID[id]
                const isCorrect = checked && id === CORRECT_ORDER_IDS[i]
                const isWrong = checked && id !== CORRECT_ORDER_IDS[i]
                const isDragging = dragIndex === i
                const isDragOver = dragOverIndex === i && dragIndex !== i
                const startLine = lineCounter
                lineCounter += block.lines.length
                return (
                  <li
                    key={id}
                    draggable={editable}
                    onDragStart={() => {
                      if (editable) setDragIndex(i)
                    }}
                    onDragOver={(e) => {
                      if (!editable) return
                      e.preventDefault()
                      if (dragOverIndex !== i) setDragOverIndex(i)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setDragOverIndex(null)
                    }}
                    onDrop={(e) => {
                      if (!editable) return
                      e.preventDefault()
                      if (dragIndex !== null) moveBlock(dragIndex, i)
                      setDragIndex(null)
                      setDragOverIndex(null)
                    }}
                    className={`rounded-lg border-2 transition-colors ${
                      editable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                    } ${
                      isCorrect
                        ? "border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_12%,transparent)]"
                        : isWrong
                          ? "border-[var(--neon-red)] bg-[color-mix(in_oklch,var(--neon-red)_12%,transparent)]"
                          : isDragOver
                            ? "border-[var(--neon-cyan)] bg-[color-mix(in_oklch,var(--neon-cyan)_10%,transparent)]"
                            : "border-white/10 bg-white/[0.03]"
                    } ${isDragging ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center gap-2 px-2 pt-1.5">
                      <span aria-hidden="true" className="shrink-0 text-sm text-gray-500">
                        ⠿
                      </span>
                      <span className="min-w-0 truncate font-mono text-[0.62rem] text-[var(--neon-cyan)]/80 sm:text-[0.68rem]">
                        {block.label}
                      </span>
                    </div>
                    <div className="px-2 pb-1.5 pt-1 font-mono text-[0.72rem] leading-relaxed sm:text-[0.8rem]">
                      {block.lines.map((line, li) => (
                        <div key={li} className="flex gap-3">
                          <span className="w-5 shrink-0 select-none text-right text-[#6e7681]">
                            {startLine + li}
                          </span>
                          <span className="min-w-0 overflow-x-auto whitespace-pre">
                            {highlightCode(line, `${id}-${li}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Panel de ejecución: barras + terminal + botón */}
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            {/* Visualización de la lista como barras */}
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-[oklch(0.08_0.04_264/0.6)] p-3">
              <p className="mb-2 shrink-0 font-pixel text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                lista
              </p>
              <div className="flex min-h-0 flex-1 items-end justify-center gap-2 sm:gap-3">
                {bars.map((v, idx) => {
                  const active =
                    activePair !== null &&
                    (activePair[0] === idx || activePair[1] === idx)
                  return (
                    <div
                      key={idx}
                      className="flex h-full flex-col items-center justify-end gap-1"
                    >
                      <div
                        className={`w-6 rounded-t-sm transition-all duration-300 sm:w-8 ${
                          active
                            ? "bg-[var(--neon-cyan)] shadow-[0_0_12px_var(--neon-cyan)]"
                            : phase === "done"
                              ? "bg-[var(--neon-green)]"
                              : "bg-[var(--neon-cyan)]/40"
                        }`}
                        style={{ height: `${Math.max((v / maxBar) * 100, 8)}%` }}
                      />
                      <span className="font-mono text-[0.7rem] text-foreground/80">
                        {v}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Terminal: salida de la "ejecución" */}
            <div className="shrink-0 rounded-xl border border-white/10 bg-[#101113] p-3 font-mono text-[0.72rem] leading-relaxed sm:text-xs">
              <p className="text-gray-500">&gt; node ordenar.js</p>
              {checked && !orderCorrect ? (
                <>
                  <p className="text-[var(--neon-red)]">
                    ✗ La función no quedó bien armada.
                  </p>
                  <p className="text-gray-400">
                    Revisá los bloques en rojo: están fuera de lugar.
                  </p>
                </>
              ) : phase === "running" ? (
                <p className="text-[var(--neon-cyan)]">{status}</p>
              ) : phase === "done" ? (
                <p className="font-semibold text-[var(--neon-green)]">✓ {status}</p>
              ) : (
                <p className="text-gray-500">Ejecutá para probar el algoritmo…</p>
              )}
            </div>

            {/* Botón ejecutar / estado resuelto */}
            {phase === "done" ? (
              <div className="shrink-0 rounded-xl border-2 border-[var(--neon-green)]/70 bg-[color-mix(in_oklch,var(--neon-green)_12%,transparent)] px-4 py-3 text-center">
                <p className="font-pixel text-[0.7rem] uppercase tracking-wide text-[var(--neon-green)]">
                  ¡Algoritmo restaurado!
                </p>
                <p className="mt-1 font-mono text-[0.72rem] text-foreground/80">
                  Cerrá esta ventana y fijate cómo quedó ADDE Labs.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRun}
                disabled={phase === "running"}
                className="shrink-0 rounded-xl border-2 border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_18%,transparent)] px-4 py-3 font-pixel text-[0.7rem] uppercase tracking-wide text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[color-mix(in_oklch,var(--neon-green)_18%,transparent)] disabled:hover:text-[var(--neon-green)]"
              >
                {phase === "running" ? "Ejecutando…" : "▶ Ejecutar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Ventana de Google Chrome con el historial: capturas ya dibujadas (traen su
 * propia barra de título, dirección y flecha "atrás"). Ocupa todo el recuadro
 * del ámbito. Las zonas clickeables (cerrar, cada entrada del
 * historial, volver) van superpuestas como botones invisibles en las
 * coordenadas de la captura, igual que en RecycleBinWindow.
 */
function ChromeHistoryWindow({
  view,
  onSelectHistory,
  onBack,
  onClose,
}: {
  view: HistoryId | null
  onSelectHistory: (id: HistoryId) => void
  onBack: () => void
  onClose: () => void
}) {
  const image =
    view === "delete"
      ? "/images/Eliminar_Archivos.png"
      : view === "fix"
        ? "/images/Error_ADDE.png"
        : "/images/Historial.png"
  const alt =
    view === "delete"
      ? "Página: Cómo eliminar un archivo (y cómo recuperarlo)"
      : view === "fix"
        ? "Página: Cómo restaurar el error de ADDE Labs"
        : "Historial de Google Chrome con dos páginas visitadas"

  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      <div className="relative h-full w-full">
        <Image
          src={image}
          alt={alt}
          width={1672}
          height={941}
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: superpuesta sobre la X roja de la captura */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
          style={{ left: "95.6%", top: "0.9%", width: "3.6%", height: "5.8%" }}
        />

        {!view ? (
          <>
            <button
              type="button"
              onClick={() => onSelectHistory("delete")}
              aria-label="Ver página: Cómo eliminar un archivo"
              className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5"
              style={{ left: "30.7%", top: "54.6%", width: "66.2%", height: "8.9%" }}
            />
            <button
              type="button"
              onClick={() => onSelectHistory("fix")}
              aria-label="Ver página: Cómo solucionar el error de ADDE Labs"
              className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5"
              style={{ left: "30.7%", top: "63.4%", width: "66.2%", height: "8.9%" }}
            />
          </>
        ) : (
          /* Volver: superpuesta sobre la flecha "atrás" de la captura */
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al historial"
            className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5"
            style={{ left: "0.8%", top: "9.3%", width: "5%", height: "8.2%" }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Ventana de la Papelera de reciclaje: captura real de una ventana de
 * Windows en vista de íconos (ya trae su propia barra de título, ribbon y
 * botón "Restaurar" dibujados). Ocupa todo el recuadro del ámbito. Las
 * zonas clickeables (cerrar, seleccionar el archivo, restaurar) van
 * superpuestas como botones invisibles en las coordenadas de la captura.
 */
function RecycleBinWindow({
  fileSelected,
  onToggleSelect,
  onRestore,
  onClose,
}: {
  fileSelected: boolean
  onToggleSelect: () => void
  onRestore: () => void
  onClose: () => void
}) {
  return (
    // inset-0: la papelera ocupa todo el recuadro del ámbito, no el área de
    // trabajo del escritorio. Papelera.png y Escritorio.png miden lo mismo
    // (1672x941), así que la captura calza exacta sobre el escritorio y los
    // botones de abajo —en % de este div— quedan sobre sus controles reales.
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      <div className="relative h-full w-full">
        <Image
          src="/images/Papelera.png"
          alt="Papelera de reciclaje de Windows con el archivo lógica_página eliminado"
          width={1672}
          height={941}
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: superpuesta sobre la X roja de la captura. Al pasar el
            mouse se aclara, como el botón real de Windows. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
          style={{ left: "95.75%", top: "1.38%", width: "3.47%", height: "3.83%" }}
        />

        {/* Ícono + nombre del archivo eliminado: seleccionable con un clic */}
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={fileSelected}
          aria-label={
            fileSelected
              ? "lógica_página seleccionado"
              : "Seleccionar lógica_página"
          }
          className={`absolute rounded-md border-2 transition-colors ${
            fileSelected
              ? "border-[#99d1ff] bg-[#cce8ff]/70"
              : "border-transparent hover:bg-black/5"
          }`}
          style={{ left: "28.7%", top: "27.1%", width: "15.6%", height: "38.3%" }}
        />

        {/* Restaurar: superpuesta sobre el botón real de la barra de
            herramientas. Solo se resalta cuando hay algo seleccionado, igual
            que un botón deshabilitado de la barra en Windows, y además
            parpadea (pulse-border, mismo efecto que "IA EN CONTROL") para
            llamar la atención sobre qué tocar después de seleccionar. */}
        <button
          type="button"
          onClick={() => {
            if (fileSelected) onRestore()
          }}
          aria-disabled={!fileSelected}
          aria-label="Restaurar el elemento seleccionado"
          className={`absolute rounded-sm outline-none transition-colors ${
            fileSelected
              ? "pulse-border cursor-pointer hover:bg-[#cce8ff]/70 hover:shadow-[inset_0_0_0_1px_#99d1ff] focus-visible:bg-[#cce8ff]/70 focus-visible:shadow-[inset_0_0_0_1px_#99d1ff]"
              : "cursor-not-allowed"
          }`}
          style={{
            left: "78.05%",
            top: "18.06%",
            width: "10.77%",
            height: "4.78%",
            ...(fileSelected ? { "--pulse-color": "#59a9f5" } as React.CSSProperties : {}),
          }}
        />
      </div>
    </div>
  )
}

/**
 * Ventana de ADDE Labs: capturas de pantalla completas (traen su propia barra
 * de título y botón de cerrar), igual que la Papelera y Chrome, y ocupa todo
 * el recuadro del ámbito. Antes de resolver el juego del archivo se ve la
 * página sin estilos, en HTML crudo (HTML_ADDE.png). Al resolverlo se ve el
 * sitio recuperado (RESTAURADA.png) y, al tocar "descargar información extra",
 * aparece la advertencia de la IA con la contraseña (LIBERAR.png). Las zonas
 * clickeables (cerrar, descargar) van superpuestas como botones invisibles en
 * las coordenadas de la captura.
 */
function AddeLabsWindow({
  solved,
  extraInfoOpen,
  onDownload,
  onClose,
}: {
  solved: boolean
  extraInfoOpen: boolean
  onDownload: () => void
  onClose: () => void
}) {
  const image = !solved
    ? "/images/HTML_ADDE.png"
    : extraInfoOpen
      ? "/images/LIBERAR.png"
      : "/images/RESTAURADA.png"
  const alt = !solved
    ? "Página de ADDE Labs sin estilos, mostrando el HTML crudo"
    : extraInfoOpen
      ? "Advertencia de la IA con la contraseña para desbloquear Visual Studio Code"
      : "Sitio de ADDE Labs recuperado, con un botón para descargar información extra"

  return (
    // inset-0: la ventana ocupa todo el recuadro del ámbito. Las tres capturas
    // miden 1672x941 igual que Escritorio.png, así que calzan exacto y los
    // botones —en % de este div— quedan sobre sus controles dibujados.
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      <div className="relative h-full w-full">
        <Image
          src={image}
          alt={alt}
          width={1672}
          height={941}
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: superpuesta sobre la X roja de la barra de título. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
          style={{ left: "95.1%", top: "1%", width: "4%", height: "5.5%" }}
        />

        {/* Descargar información extra: superpuesta sobre el botón del pie,
            solo en el sitio recuperado (antes de descargar). */}
        {solved && !extraInfoOpen ? (
          <button
            type="button"
            onClick={onDownload}
            aria-label="Descargar información extra"
            className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
            style={{ left: "2.3%", top: "86.3%", width: "95.3%", height: "11.3%" }}
          />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Ventana de Visual Studio Code, con el mismo formato que la Papelera, Chrome
 * y ADDE Labs: ocupa todo el recuadro del ámbito, no una ventanita chica.
 *
 * Bloqueada: se ve AppBloqueada.png (que ya trae su barra de título y su X)
 * con un campo de contraseña superpuesto en el hueco del panel; solo K7-NOVA
 * desbloquea. Desbloqueada: el editor, que no es una captura sino la UI real
 * donde hay que activar la variable, así que se dibuja a pantalla completa
 * con su propia barra de título estilo VS Code.
 */
function VsCodeWindow({
  unlocked,
  passwordInput,
  passwordError,
  onPasswordChange,
  onSubmitPassword,
  iaRecuperada,
  onToggleIa,
  onClose,
}: {
  unlocked: boolean
  passwordInput: string
  passwordError: boolean
  onPasswordChange: (value: string) => void
  onSubmitPassword: () => void
  iaRecuperada: boolean
  onToggleIa: () => void
  onClose: () => void
}) {
  // El mensaje del fragmento se puede cerrar para seguir mirando el editor, y
  // se vuelve a abrir tocando "true" si necesitan releer el código.
  const [fragmentOpen, setFragmentOpen] = useState(false)

  function handleCodeClick() {
    if (!iaRecuperada) onToggleIa()
    setFragmentOpen(true)
  }

  // inset-0: mismo encuadre que el resto de las ventanas del escritorio.
  if (!unlocked) {
    return (
      <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
        <div className="relative h-full w-full">
          <Image
            src="/images/AppBloqueada.png"
            alt="Visual Studio Code bloqueado por la IA corrupta: pide una contraseña para desbloquearlo"
            width={1672}
            height={941}
            priority
            className="h-full w-full select-none object-fill"
          />

          {/* Cerrar: sobre la X roja de la barra de título dibujada. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Visual Studio Code"
            className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
            style={{ left: "93.66%", top: "1.91%", width: "5.02%", height: "6.16%" }}
          />

          {/* Contraseña: va en el hueco del panel, justo debajo del texto que
              pide ingresarla, para que se lea como parte de la pantalla. */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmitPassword()
            }}
            className="absolute left-1/2 top-[66%] flex w-[60%] -translate-x-1/2 flex-col items-center gap-3"
          >
            <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="CONTRASEÑA"
                aria-label="Contraseña para desbloquear Visual Studio Code"
                aria-invalid={passwordError}
                autoComplete="off"
                spellCheck={false}
                className={`w-1/2 min-w-0 rounded-md border-2 bg-[oklch(0.16_0.05_240/0.85)] px-3 py-2 text-center font-mono text-base uppercase tracking-[0.25em] text-[var(--neon-cyan)] outline-none transition-colors placeholder:tracking-normal placeholder:text-white/35 sm:text-lg ${
                  passwordError
                    ? "border-red-400 focus:border-red-300"
                    : "border-[var(--neon-cyan)]/60 focus:border-[var(--neon-cyan)]"
                }`}
              />
              <button
                type="submit"
                className="shrink-0 cursor-pointer rounded-md border-2 border-[var(--neon-cyan)]/70 bg-[oklch(0.16_0.05_240/0.85)] px-4 py-2 font-pixel text-[0.7rem] text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background sm:text-xs"
              >
                Desbloquear
              </button>
            </div>

            {/* aria-live: quien use lector de pantalla se entera del error. */}
            <p
              aria-live="polite"
              className={`font-mono text-sm text-red-300 sm:text-base ${
                passwordError ? "visible" : "invisible"
              }`}
            >
              Contraseña incorrecta.
            </p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      {/* @container: el código de abajo se mide en cqw, así que escala junto
          con la imagen y siempre cae dentro del editor. */}
      <div className="@container relative h-full w-full">
        <Image
          src="/images/VSCode_False.png"
          alt="Visual Studio Code abierto con el archivo recuperar_ia.js"
          width={1672}
          height={941}
          priority
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: sobre la X roja de la barra de título dibujada. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar Visual Studio Code"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/20 focus-visible:bg-white/20"
          style={{ left: "95.6%", top: "1.3%", width: "3.6%", height: "4.5%" }}
        />

        {/* El editor de la captura está vacío: el código va acá arriba, para
            que "false" se pueda tocar de verdad. */}
        <div
          className="absolute font-mono text-[1.5cqw] leading-[1.95]"
          style={{ left: "23.6%", top: "14.5%", width: "74%" }}
        >
          <CodeLine n={1}>
            <span className="text-[#6a9955]">
              // Sistema de recuperación — ADDE Labs
            </span>
          </CodeLine>
          <CodeLine n={2}>
            <span className="text-[#6a9955]">
              // Cambiá la variable para intentar recuperarla.
            </span>
          </CodeLine>
          <CodeLine n={3}>&nbsp;</CodeLine>
          <CodeLine n={4}>
            <span className="text-[#569cd6]">const</span>{" "}
            <span className="text-[#9cdcfe]">iaRecuperada</span> ={" "}
            <button
              type="button"
              onClick={handleCodeClick}
              aria-label={
                iaRecuperada
                  ? "Ver de nuevo el código del fragmento"
                  : "Cambiar iaRecuperada a true para recuperar la IA"
              }
              className={`cursor-pointer rounded px-[0.4cqw] font-bold underline decoration-dashed underline-offset-4 transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none ${
                iaRecuperada ? "text-[#4ec9b0]" : "text-[#569cd6]"
              }`}
            >
              {iaRecuperada ? "true" : "false"}
            </button>
            <span className="text-[#d4d4d4]">;</span>
          </CodeLine>
          <CodeLine n={5}>&nbsp;</CodeLine>
          <CodeLine n={6}>
            <span className="text-[#569cd6]">function</span>{" "}
            <span className="text-[#dcdcaa]">liberarFragmento</span>
            <span className="text-[#d4d4d4]">() {"{"}</span>
          </CodeLine>
          <CodeLine n={7}>
            <span className="text-[#d4d4d4]">
              {"  "}
              <span className="text-[#c586c0]">if</span> (!iaRecuperada) {"{"}
            </span>
          </CodeLine>
          <CodeLine n={8}>
            <span className="text-[#d4d4d4]">{"    "}</span>
            <span className="text-[#c586c0]">return</span>{" "}
            <span className="text-[#ce9178]">"Esperando recuperación..."</span>
            <span className="text-[#d4d4d4]">;</span>
          </CodeLine>
          <CodeLine n={9}>
            <span className="text-[#d4d4d4]">{"  }"}</span>
          </CodeLine>
          {/* El código no se puede espiar antes de tiempo: hasta que la IA no
              se recupera, el fragmento aparece tapado. */}
          <CodeLine n={10}>
            <span className="text-[#d4d4d4]">{"  "}</span>
            <span className="text-[#c586c0]">return</span>{" "}
            <span className="text-[#ce9178]">
              "Fragmento liberado:{" "}
              {iaRecuperada ? (
                FRAGMENT_CODE
              ) : (
                <span className="text-[#6e7681]">██████</span>
              )}
              "
            </span>
            <span className="text-[#d4d4d4]">;</span>
          </CodeLine>
          <CodeLine n={11}>
            <span className="text-[#d4d4d4]">{"}"}</span>
          </CodeLine>
          {/* Marca del hacker: un comentario "de más" que parece un apunte
              suelto, pero es la frase "re heavy re pesado" escrita al revés
              (odasep er yvaeh er). Es la muletilla de Belén en la entrevista,
              así que leerla de atrás para adelante la delata. Sin herramientas:
              se resuelve leyéndola al revés. Va tenue, como algo que quedó
              pegado en el código sin querer. */}
          <CodeLine n={12}>
            <span className="text-[#6a9955]/70">{"// nota: odasep er yvaeh er"}</span>
          </CodeLine>
          <CodeLine n={13}>
            <span className="text-[#dcdcaa]">console</span>
            <span className="text-[#d4d4d4]">.</span>
            <span className="text-[#dcdcaa]">log</span>
            <span className="text-[#d4d4d4]">(liberarFragmento());</span>
          </CodeLine>
        </div>

        {/* Salida de la terminal: la captura ya trae "Esperando
            recuperación...", así que solo se tapa cuando cambia. */}
        {iaRecuperada ? (
          <div
            className="absolute flex items-center bg-[#101113] font-mono text-[1.5cqw] font-bold text-[#4ec9b0]"
            style={{ left: "23.3%", top: "92.3%", width: "50%", height: "4.3%" }}
          >
            Fragmento liberado: {FRAGMENT_CODE}
          </div>
        ) : null}

        {fragmentOpen ? (
          <FragmentUnlockedOverlay onClose={() => setFragmentOpen(false)} />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Mensaje que tapa la pantalla al recuperar la IA, con el código del
 * fragmento. Usa la misma estética que las pantallas de victoria del resto de
 * los ámbitos (por ejemplo la card del AMI): marco y tipografía neón verde,
 * fondo oscuro translúcido.
 */
function FragmentUnlockedOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fragmento recuperado"
      className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[1rem] bg-[oklch(0.06_0.03_264/0.92)] p-4 text-center"
    >
      <div className="flex w-full max-w-lg flex-col items-center gap-5 rounded-xl border-4 border-[var(--neon-green)]/70 bg-[oklch(0.1_0.05_264/0.9)] px-6 py-7 shadow-[0_0_40px_color-mix(in_oklch,var(--neon-green)_40%,transparent)]">
        <p className="font-pixel text-xl uppercase tracking-[0.15em] text-[var(--neon-green)] sm:text-2xl">
          IA recuperada
        </p>

        <p className="font-mono text-sm leading-relaxed text-foreground/95 sm:text-[1.05rem]">
          El sistema volvió a responder y liberó el fragmento del ámbito CEO.
          El código es:
        </p>

        <p className="rounded-md border-2 border-[var(--neon-green)]/60 bg-[oklch(0.14_0.05_264/0.7)] px-6 py-2.5 font-mono text-2xl font-bold tracking-[0.3em] text-[var(--neon-green)] sm:text-3xl">
          {FRAGMENT_CODE}
        </p>

        <p className="font-mono text-xs text-muted-foreground sm:text-sm">
          Anotalo: lo van a necesitar para armar el núcleo de la IA.
        </p>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-1 cursor-pointer rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-2 font-pixel text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * PENSAMIENTOS DE LA INVESTIGACIÓN
 * El ámbito es una investigación, así que quien juega "piensa en voz alta":
 * un globo va comentando lo que tiene delante y qué conviene hacer después.
 * Funciona además como pista suave, para que nadie quede trabado sin saber
 * a dónde ir. Cada pensamiento tiene un id: cuando cambia el id aparece un
 * globo nuevo, y si lo cierran no vuelve hasta que cambie la situación.
 * ---------------------------------------------------------------------- */

type Thought = { id: string; text: string }

/**
 * Cosas que quien investiga ya averiguó. Se separan del avance del juego
 * porque el orden de exploración es libre: se puede abrir la papelera antes
 * de saber para qué sirve el archivo, o ver ADDE Labs rota sin saber por qué.
 * Los pensamientos no pueden dar por sabido algo que todavía no se leyó.
 */
type Discovery =
  /** Vio que Visual Studio Code está bloqueado y pide contraseña. */
  | "vscode-bloqueado"
  /** Leyó en el historial que lo borrado va a la papelera y se restaura. */
  | "como-restaurar"
  /** Leyó en el historial por qué se cayó ADDE Labs (falta el archivo). */
  | "causa-del-error"
  /** Vio con sus propios ojos la página de ADDE Labs rota. */
  | "labs-rota"
  /** Encontró un archivo eliminado en la papelera. */
  | "archivo-en-papelera"
  /** Vio la contraseña K7-NOVA en la información extra de ADDE Labs. */
  | "contrasena"

type ThoughtState = {
  openWindow: WindowKind
  fileSelected: boolean
  fileRestored: boolean
  solved: boolean
  historyView: HistoryId | null
  extraInfoOpen: boolean
  vscodeUnlocked: boolean
  passwordError: boolean
  iaRecuperada: boolean
  known: Discovery[]
}

/**
 * Devuelve el pensamiento que corresponde al momento actual, mirando tanto la
 * ventana abierta como lo que ya se averiguó. La idea es que nunca "sepa" de
 * más: si todavía no leyeron el historial, el archivo de la papelera es un
 * misterio; recién después se entiende que era el de ADDE Labs.
 */
function getThought(s: ThoughtState): Thought | null {
  if (s.iaRecuperada) return null // el mensaje del fragmento ya dice todo

  const sabe = (d: Discovery) => s.known.includes(d)

  /* ------------------------------ Visual Studio Code ------------------------------ */
  if (s.openWindow === "vscode") {
    if (!s.vscodeUnlocked) {
      if (s.passwordError) {
        return {
          id: "vscode-error",
          text: "Esa no es. La contraseña tiene que estar en algún lado de esta misma computadora.",
        }
      }
      if (sabe("contrasena")) {
        return {
          id: "vscode-con-clave",
          text: "Ahora sí: la contraseña era K7-NOVA.",
        }
      }
      return {
        id: "vscode-locked",
        text: "Bloqueada. La IA la trabó antes de que pudieran restaurarla… Si alguien anduvo en esta compu, algo tuvo que quedar registrado.",
      }
    }
    return {
      id: "vscode-open",
      text: "Adentro. Este código decide si la IA se recupera… y hay un false que no debería estar ahí.",
    }
  }

  /* ---------------------------------- Papelera ---------------------------------- */
  if (s.openWindow === "papelera") {
    if (s.fileRestored) {
      return {
        id: "papelera-restaurada",
        text: sabe("causa-del-error")
          ? "Listo, el archivo volvió a su lugar. Ahora ADDE Labs debería tener con qué funcionar."
          : "Listo, el archivo volvió a su lugar. Falta ver a qué página pertenecía.",
      }
    }
    if (s.fileSelected) {
      return {
        id: "papelera-seleccionado",
        text: "Seleccionado. Ahora, Restaurar.",
      }
    }
    // Lo que se piensa al ver el archivo depende de si ya se sabe qué es.
    if (sabe("causa-del-error")) {
      return {
        id: "papelera-archivo-sabe",
        text: "Ahí está: lógica_página, el archivo que le falta a ADDE Labs. Lo restauro y listo.",
      }
    }
    if (sabe("labs-rota")) {
      return {
        id: "papelera-archivo-sospecha",
        text: "Un archivo borrado: lógica_página. ¿Tendrá algo que ver con la página que se ve rota?",
      }
    }
    return {
      id: "papelera-archivo",
      text: "Alguien borró un archivo: lógica_página. Todavía no sé de dónde salió, pero acá quedó.",
    }
  }

  /* ---------------------------------- ADDE Labs ---------------------------------- */
  if (s.openWindow === "labs") {
    if (!s.solved) {
      return sabe("causa-del-error")
        ? {
            id: "labs-rota-sabe",
            text: "Tal cual decía la búsqueda: sin ese archivo la página queda en HTML pelado, sin estilos.",
          }
        : {
            id: "labs-rota",
            text: "La página de ADDE Labs se ve rota, como si le faltara todo el diseño. Alguien le sacó algo…",
          }
    }
    return s.extraInfoOpen
      ? {
          id: "labs-clave",
          text: "K7-NOVA. Esa es la contraseña que necesito para Visual Studio Code.",
        }
      : {
          id: "labs-restaurada",
          text: "El sitio volvió a la normalidad. Y dejó algo para descargar… veamos esa información extra.",
        }
  }

  /* ----------------------------------- Chrome ----------------------------------- */
  if (s.openWindow === "chrome") {
    if (s.historyView === "delete") {
      return {
        id: "chrome-delete",
        text: "Lo que se borra no desaparece: queda en la papelera y se puede restaurar. Buen dato.",
      }
    }
    if (s.historyView === "fix") {
      return {
        id: "chrome-fix",
        text: "Acá está: ADDE Labs se cayó porque le borraron el archivo con las instrucciones para ordenar una lista.",
      }
    }
    return {
      id: "chrome-historial",
      text: "Dos búsquedas en el historial. Alguien estuvo averiguando justo cómo hacer todo esto…",
    }
  }

  /* ------------------------- Escritorio, sin nada abierto ------------------------- */
  // Arranca por Visual Studio Code: es el objetivo, y descubrir que está
  // bloqueado es lo que da sentido a revisar el resto de la computadora.
  if (!sabe("vscode-bloqueado")) {
    return {
      id: "escritorio-inicio",
      text: "Sabemos que hay código para recuperar, así que empecemos por lo obvio: Visual Studio Code.",
    }
  }
  if (s.vscodeUnlocked) {
    return {
      id: "escritorio-final",
      text: "Visual Studio Code ya está abierto. Falta activar la recuperación de la IA.",
    }
  }
  if (sabe("contrasena")) {
    return {
      id: "escritorio-con-clave",
      text: "Ya tengo la contraseña. A Visual Studio Code.",
    }
  }
  if (s.solved) {
    return sabe("causa-del-error") || sabe("labs-rota")
      ? {
          id: "escritorio-post-arreglo",
          text: "El archivo ya está reconstruido. Veamos cómo quedó ADDE Labs.",
        }
      : {
          id: "escritorio-post-arreglo-ciego",
          text: "El algoritmo quedó armado. Ahora habría que ver a qué página le servía todo esto.",
        }
  }
  if (s.fileRestored) {
    return {
      id: "escritorio-restaurado",
      text: "Recuperé el archivo, pero el código quedó desordenado. Hay que dejarlo en su orden correcto.",
    }
  }
  if (sabe("como-restaurar") || sabe("causa-del-error")) {
    return {
      id: "escritorio-a-papelera",
      text: "Si borraron un archivo, tiene que estar en la papelera. Vamos a buscarlo ahí.",
    }
  }
  if (sabe("archivo-en-papelera") || sabe("labs-rota")) {
    return {
      id: "escritorio-investigar",
      text: "Tengo piezas sueltas y ninguna explicación. Capaz el navegador guarde lo que estuvieron haciendo acá.",
    }
  }
  return {
    id: "escritorio-buscar-clave",
    text: "Sin la contraseña no entro. Alguien la usó desde esta compu: revisemos qué dejó abierto.",
  }
}

/** Lee los datos del equipo cargados en TeamSetupScreen (mismo storage que usa
 *  LabConversation para identificar al equipo durante la partida). */
function readTeam(): TeamData | null {
  try {
    const raw = sessionStorage.getItem("escape-room-team")
    return raw ? (JSON.parse(raw) as TeamData) : null
  } catch {
    return null
  }
}

/**
 * Panel de pensamiento: mismo formato de panel lateral que RoomsProgress (el
 * panel de "salas completadas" del plano) — un aside angosto al costado de la
 * escena, no una burbuja flotando encima de la pantalla de la compu. En vez de
 * un genérico "Pensando…", encabeza con la foto y el nombre del equipo (así
 * se lee como SU propio pensamiento), y el texto se escribe de a poco con el
 * mismo efecto máquina de escribir que las entrevistas.
 */
function ThoughtBubble({
  text,
  team,
  onDismiss,
}: {
  text: string
  team: TeamData | null
  onDismiss: () => void
}) {
  return (
    <aside className="pointer-events-auto relative w-full shrink-0 rounded-[1.5rem] border border-[var(--neon-cyan)]/30 bg-[oklch(0.09_0.04_264/0.72)] p-4 pr-9 shadow-[0_0_36px_color-mix(in_oklch,var(--neon-cyan)_18%,transparent)] backdrop-blur-sm lg:w-72">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--neon-cyan)]/50 bg-[oklch(0.18_0.045_264/0.6)]">
          {team?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.avatar}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="font-pixel text-[0.6rem] text-[var(--neon-cyan)]">
              {(team?.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="min-w-0 truncate font-pixel text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
          {team?.name || "Pensando…"}
        </p>
      </div>

      <Typewriter
        key={text}
        text={text}
        className="mt-2 font-mono text-sm leading-relaxed text-foreground/90"
      />

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Ocultar este pensamiento"
        className="absolute right-2 top-2 cursor-pointer rounded px-1.5 py-0.5 font-mono text-sm text-foreground/50 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        ✕
      </button>
    </aside>
  )
}

export function CeoDesktopGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al liberar el fragmento (ganar), para marcar el ámbito resuelto. */
  onWin?: () => void
}) {
  const [openWindow, setOpenWindow] = useState<WindowKind>(null)
  const [fileSelected, setFileSelected] = useState(false)
  const [fileRestored, setFileRestored] = useState(false)
  // Se resuelve dentro de SortAlgorithmGame (que maneja su propio orden y
  // ejecución); acá solo se guarda para habilitar ADDE Labs recuperada.
  const [solved, setSolved] = useState(false)
  const [historyView, setHistoryView] = useState<HistoryId | null>(null)
  const [extraInfoOpen, setExtraInfoOpen] = useState(false)
  const [iaRecuperada, setIaRecuperada] = useState(false)
  const [vscodeUnlocked, setVscodeUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  // Pensamientos que ya cerraron: una vez descartado, ese no vuelve a
  // aparecer, pero sí los nuevos que traiga cada avance.
  const [thoughtsDismissed, setThoughtsDismissed] = useState<string[]>([])
  // Lo que ya se averiguó, en orden libre: los pensamientos se apoyan en esto
  // para no dar por sabido algo que todavía no se leyó.
  const [known, setKnown] = useState<Discovery[]>([])
  // Equipo registrado (nombre + foto), para encabezar el panel de pensamiento
  // con quién está pensando en vez de un genérico "Pensando…".
  const [team, setTeam] = useState<TeamData | null>(null)
  useEffect(() => {
    setTeam(readTeam())
  }, [])

  const color = LAB_COLORS.CEO

  /** Anota un descubrimiento (sin repetirlo si ya estaba). */
  function discover(d: Discovery) {
    setKnown((prev) => (prev.includes(d) ? prev : [...prev, d]))
  }

  /** Abre una app del escritorio y anota lo que se descubre al verla. */
  function openApp(kind: Exclude<WindowKind, null>) {
    setOpenWindow(kind)
    if (kind === "papelera" && !fileRestored) discover("archivo-en-papelera")
    if (kind === "labs" && !solved) discover("labs-rota")
    if (kind === "vscode" && !vscodeUnlocked) discover("vscode-bloqueado")
  }

  const thought = getThought({
    openWindow,
    fileSelected,
    fileRestored,
    solved,
    historyView,
    extraInfoOpen,
    vscodeUnlocked,
    passwordError,
    iaRecuperada,
    known,
  })

  /**
   * Desbloquea VS Code solo con la contraseña exacta. Ignora mayúsculas y
   * espacios al borde (k7-nova y "  K7-NOVA " sirven), pero el guion sí hay
   * que escribirlo tal como aparece en ADDE Labs.
   */
  function handleUnlockVscode() {
    if (passwordInput.trim().toUpperCase() === VSCODE_PASSWORD) {
      setVscodeUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  /** Recuperar la IA es de ida: una vez liberada no se vuelve a false. */
  function handleRecuperarIa() {
    if (iaRecuperada) return
    setIaRecuperada(true)
    // Al liberar el fragmento se da por resuelto el ámbito.
    onWin?.()
  }

  function closeWindow() {
    setOpenWindow(null)
    setHistoryView(null)
  }

  return (
    <main className="scanlines fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background p-3 sm:p-4">
      {/* Fondo de la escena, igual al resto de los ámbitos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.1_0.04_264/0.35)_0%,transparent_30%,oklch(0.1_0.04_264/0.85)_100%)]"
      />

      {/* Salir: solo disponible una vez recuperado el fragmento. Mientras se
          juega no se puede salir, porque este juego no guarda su progreso
          entre entradas (se reinicia de cero al volver a abrirlo). */}
      {onExit && iaRecuperada ? (
        <button
          type="button"
          onClick={onExit}
          className="absolute right-4 top-4 z-[60] rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
        >
          Salir
        </button>
      ) : null}

      {/* z-[55]: por encima de las líneas de escaneo (z-50), así las
          ventanas de la compu se leen nítidas; el resto de la escena
          (fondo cyber, botón Salir) sigue teniendo el efecto CRT. */}
      <div className="pointer-events-none relative z-[55] flex h-full w-full flex-col items-center justify-center gap-3 overflow-auto lg:flex-row lg:gap-6">
        {/* Escenario enmarcado, mismo marco (borde, tamaño y encuadre) que el
            retrato de las entrevistas y que la rueda de reconocimiento del
            CIDI, para mantener consistencia visual entre ámbitos. El div
            interno se ajusta exactamente a la imagen, así los hotspots de los
            íconos —definidos en % de la imagen— calzan siempre. */}
        <div
          className="pointer-events-auto relative flex max-h-full shrink-0 rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          <div className="relative">
            <Image
              src="/images/Escritorio.png"
              alt="Escritorio de la computadora, con la papelera, Visual Studio Code, Google Chrome y ADDE Labs"
              width={1672}
              height={941}
              priority
              className="max-h-[60vh] w-auto select-none rounded-[1rem] object-contain sm:max-h-[70vh] lg:max-h-[92vh]"
            />

            {!openWindow ? (
              <>
                <button
                  type="button"
                  onClick={() => openApp("papelera")}
                  aria-label="Abrir la papelera"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.papelera}
                />
                <button
                  type="button"
                  onClick={() => openApp("labs")}
                  aria-label="Abrir ADDE Labs"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.labs}
                />
                <button
                  type="button"
                  onClick={() => openApp("chrome")}
                  aria-label="Abrir Google Chrome"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.chrome}
                />
                <button
                  type="button"
                  onClick={() => openApp("vscode")}
                  aria-label="Abrir Visual Studio Code"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.vscode}
                />
              </>
            ) : null}

            {/* Ventana: Papelera → captura real de Windows, sin restaurar */}
            {openWindow === "papelera" && !fileRestored ? (
              <RecycleBinWindow
                fileSelected={fileSelected}
                onToggleSelect={() => setFileSelected((v) => !v)}
                onRestore={() => setFileRestored(true)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: Papelera restaurada → desafío de armar y ejecutar el
                algoritmo, a pantalla completa. */}
            {openWindow === "papelera" && fileRestored ? (
              <SortAlgorithmGame
                solved={solved}
                onSolved={() => setSolved(true)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: ADDE Labs → usa capturas (HTML_ADDE, RESTAURADA, LIBERAR) */}
            {openWindow === "labs" ? (
              <AddeLabsWindow
                solved={solved}
                extraInfoOpen={extraInfoOpen}
                onDownload={() => {
                  setExtraInfoOpen(true)
                  discover("contrasena")
                }}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: Google Chrome → historial con 2 páginas visitadas */}
            {openWindow === "chrome" ? (
              <ChromeHistoryWindow
                view={historyView}
                onSelectHistory={(id) => {
                  setHistoryView(id)
                  discover(id === "delete" ? "como-restaurar" : "causa-del-error")
                }}
                onBack={() => setHistoryView(null)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: VS Code → bloqueado hasta ingresar K7-NOVA, y después
                el código real que hay que "activar" */}
            {openWindow === "vscode" ? (
              <VsCodeWindow
                unlocked={vscodeUnlocked}
                passwordInput={passwordInput}
                passwordError={passwordError}
                onPasswordChange={(value) => {
                  setPasswordInput(value)
                  setPasswordError(false)
                }}
                onSubmitPassword={handleUnlockVscode}
                iaRecuperada={iaRecuperada}
                onToggleIa={handleRecuperarIa}
                onClose={closeWindow}
              />
            ) : null}
          </div>
        </div>

        {/* Pensamiento de quien investiga: panel al costado de la pantalla
            (mismo formato que el panel de "salas completadas" del plano), en
            vez de una burbuja flotando encima que tape íconos o ventanas. */}
        {thought && !thoughtsDismissed.includes(thought.id) ? (
          <ThoughtBubble
            text={thought.text}
            team={team}
            onDismiss={() =>
              setThoughtsDismissed((prev) => [...prev, thought.id])
            }
          />
        ) : null}
      </div>
    </main>
  )
}
