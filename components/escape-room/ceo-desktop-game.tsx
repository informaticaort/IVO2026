"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { LAB_COLORS } from "./floor-plan"

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

type Step = { id: string; text: string; icon: string }

// Pasos en pseudocódigo clásico (INICIO/MIENTRAS/SI/ENTONCES/FIN) que, en
// este orden, describen el algoritmo completo para ordenar la lista
// (bubble sort) en español simple, sin sintaxis de ningún lenguaje real.
const CORRECT_ORDER: Step[] = [
  {
    id: "s1",
    icon: "🏁",
    text: "INICIO\nSuponer que todavía puede haber números para intercambiar",
  },
  {
    id: "s2",
    icon: "🔁",
    text: "MIENTRAS pueda haber cambios, HACER:\nSuponer que en esta vuelta no va a haber ningún cambio",
  },
  {
    id: "s3",
    icon: "👉",
    text: "PARA cada par de números vecinos, HACER:",
  },
  {
    id: "s4",
    icon: "❓",
    text: "SI el número de la izquierda es mayor que el de la derecha, ENTONCES:\nIntercambiar los dos números de lugar\nMarcar que en esta vuelta sí hubo un cambio",
  },
  {
    id: "s5",
    icon: "🔄",
    text: "Terminar de revisar todos los pares y volver a repetir el MIENTRAS",
  },
  {
    id: "s6",
    icon: "✅",
    text: "Cuando una vuelta completa no tuvo cambios, la lista ya está ordenada\nFIN",
  },
]

// Orden inicial mezclado: ninguna línea arranca en su lugar correcto.
const SCRAMBLED_ORDER = ["s4", "s6", "s1", "s5", "s3", "s2"]

const STEPS_BY_ID = Object.fromEntries(CORRECT_ORDER.map((s) => [s.id, s]))

type HistoryId = "delete" | "fix"

// Código de 6 caracteres que se revela al recuperar la IA en VS Code.
const FRAGMENT_CODE = "H4CK3D"

// Contraseña que bloqueó la IA corrupta sobre VS Code (se revela en ADDE Labs).
const VSCODE_PASSWORD = "LIBERAR"

// Posiciones de los íconos sobre Escritorio.png (en % de la imagen). Los
// cuatro están en una sola columna a la izquierda; cada área cubre el ícono
// más su etiqueta, como el rectángulo de selección de un escritorio real.
const ICONS = {
  papelera: { left: "3.11%", top: "1.91%", width: "7.18%", height: "17.21%" },
  vscode: { left: "1.50%", top: "23.59%", width: "10.35%", height: "20.83%" },
  chrome: { left: "1.08%", top: "46.55%", width: "11.18%", height: "17.43%" },
  labs: { left: "2.09%", top: "68.55%", width: "9.15%", height: "19.45%" },
}

// Área "de trabajo" del escritorio: ahí adentro se centran las "ventanas" de
// las apps. Escritorio.png es la pantalla completa (sin bisel ni barra de
// tareas), así que el área arranca a la derecha de la columna de íconos y
// deja un margen parejo contra el borde del recuadro.
const WORK_AREA = { left: "15%", top: "8%", width: "80%", height: "80%" }

type WindowKind = "papelera" | "labs" | "chrome" | "vscode" | null

/** Línea de código con número, estilo editor. */
function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 shrink-0 select-none text-right text-[#6e7681]">{n}</span>
      <span className="whitespace-pre">{children}</span>
    </div>
  )
}

// Palabras del pseudocódigo que se resaltan dentro de cada tarjeta.
const PSEUDOCODE_KEYWORDS = ["INICIO", "FIN", "MIENTRAS", "HACER", "PARA", "SI", "ENTONCES"]

/** Resalta en color de acento las palabras clave del pseudocódigo dentro de una línea. */
function highlightKeywords(line: string, keyPrefix: string): React.ReactNode[] {
  const re = new RegExp(`\\b(${PSEUDOCODE_KEYWORDS.join("|")})\\b`, "g")
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = re.exec(line))) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index))
    nodes.push(
      <span key={`${keyPrefix}-${i++}`} className="font-bold neon-cyan">
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex))
  return nodes
}

/**
 * Juego de ordenar: pantalla completa con tarjetas grandes y prolijas (sin
 * scroll, se leen bien en cualquier tamaño) en vez de una ventanita de
 * "Bloc de notas". Cada tarjeta es un paso en pseudocódigo simple, en
 * español, sin sintaxis de ningún lenguaje real — pensado para gente que no
 * programa. En el orden correcto arman el algoritmo completo para ordenar
 * la lista.
 */
function SortAlgorithmGame({
  order,
  dragIndex,
  dragOverIndex,
  checked,
  orderCorrect,
  solved,
  onDragStart,
  onDragOverIndex,
  onDragEnd,
  onDropIndex,
  onSave,
  onClose,
}: {
  order: string[]
  dragIndex: number | null
  dragOverIndex: number | null
  checked: boolean
  orderCorrect: boolean
  solved: boolean
  onDragStart: (i: number) => void
  onDragOverIndex: (i: number) => void
  onDragEnd: () => void
  onDropIndex: (i: number) => void
  onSave: () => void
  onClose: () => void
}) {
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

      <div className="relative flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] border-4 border-[var(--neon-cyan)]/70 bg-[oklch(0.1_0.04_264/0.92)] p-4 shadow-[0_0_45px_color-mix(in_oklch,var(--neon-cyan)_35%,transparent)] sm:p-6">
        <div className="flex shrink-0 items-center justify-between gap-3 pb-3 sm:pb-4">
          <div className="min-w-0">
            <p className="truncate font-pixel text-xs uppercase tracking-[0.2em] neon-cyan sm:text-sm">
              lógica_página · algoritmo para ordenar
            </p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground sm:text-xs">
              Arrastrá los pasos (⠿) hasta que queden en el orden correcto.
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

        <ul className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-2.5">
          {order.map((id, i) => {
            const step = STEPS_BY_ID[id]
            const isCorrect = checked && id === CORRECT_ORDER[i].id
            const isWrong = checked && id !== CORRECT_ORDER[i].id
            const isDragging = dragIndex === i
            const isDragOver = dragOverIndex === i && dragIndex !== i
            const lines = step.text.split("\n")
            return (
              <li
                key={id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => {
                  e.preventDefault()
                  onDragOverIndex(i)
                }}
                onDragEnd={onDragEnd}
                onDrop={(e) => {
                  e.preventDefault()
                  onDropIndex(i)
                }}
                className={`flex min-h-0 flex-1 cursor-grab items-center gap-3 rounded-xl border-2 px-3 py-2 transition-colors active:cursor-grabbing sm:gap-4 sm:px-4 ${
                  isCorrect
                    ? "border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_14%,transparent)]"
                    : isWrong
                      ? "border-[var(--neon-red)] bg-[color-mix(in_oklch,var(--neon-red)_14%,transparent)]"
                      : isDragOver
                        ? "border-[var(--neon-cyan)] bg-[color-mix(in_oklch,var(--neon-cyan)_12%,transparent)]"
                        : "border-white/15 bg-white/[0.04]"
                } ${isDragging ? "opacity-40" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg text-muted-foreground sm:text-xl"
                >
                  ⠿
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-current font-pixel text-[0.65rem] text-[var(--neon-cyan)] sm:size-8 sm:text-xs">
                  {i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-xl sm:block sm:text-2xl"
                >
                  {step.icon}
                </span>
                <div className="min-w-0 flex-1 text-[clamp(0.72rem,1.3vw,1rem)] leading-snug text-foreground/90">
                  {lines.map((line, li) => (
                    <p key={li} className={li > 0 ? "mt-0.5 pl-4" : ""}>
                      {highlightKeywords(line, `${id}-${li}`)}
                    </p>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex shrink-0 flex-wrap items-center gap-3 pt-3 sm:pt-4">
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border-2 border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_18%,transparent)] px-4 py-2 font-pixel text-[0.6rem] uppercase tracking-wide text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background sm:text-[0.7rem]"
          >
            Probar orden
          </button>
          {checked && !orderCorrect ? (
            <p className="font-mono text-[0.75rem] font-semibold text-[var(--neon-red)] sm:text-sm">
              Todavía no está bien. Seguí probando.
            </p>
          ) : null}
          {solved ? (
            <p className="font-mono text-[0.75rem] font-semibold text-[var(--neon-green)] sm:text-sm">
              ¡Listo! Cerrá esta ventana y andá a ADDE Labs.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Barra de título estilo Windows: minimizar/maximizar decorativos + cerrar funcional. */
function ScreenWindow({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute z-10 flex items-center justify-center overflow-hidden p-3 sm:p-5"
      style={WORK_AREA}
    >
      {/* La ventana tiene un tamaño constante y queda centrada dentro del
          área de trabajo del escritorio (por encima de la barra de tareas),
          como una app real con un tamaño fijo. Esquinas rectas, borde fino
          y sombra dura: chrome de ventana estilo Windows, no una card de iOS. */}
      <div className="flex h-[85%] w-[85%] flex-col overflow-hidden border border-[#8a8a8a] bg-white shadow-[0_3px_14px_rgba(0,0,0,0.45)]">
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-gray-300 bg-[#f0f0f0] pl-3 sm:h-9">
          <p className="truncate text-sm font-semibold text-gray-700 sm:text-base">
            {title}
          </p>
          <div className="flex h-full shrink-0">
            <span
              aria-hidden="true"
              className="flex w-11 items-center justify-center text-sm text-gray-600 hover:bg-[#e5e5e5] sm:w-12"
            >
              &#x2013;
            </span>
            <span
              aria-hidden="true"
              className="flex w-11 items-center justify-center text-[0.65rem] text-gray-600 hover:bg-[#e5e5e5] sm:w-12"
            >
              &#x25A1;
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="flex w-11 items-center justify-center text-sm text-gray-600 transition-colors hover:bg-[#e81123] hover:text-white sm:w-12"
            >
              &#x2715;
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white text-base leading-snug sm:text-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Ventana de Google Chrome con el historial: capturas ya dibujadas (traen su
 * propia barra de título, dirección y flecha "atrás"), así que no se
 * envuelven en ScreenWindow. Las zonas clickeables (cerrar, cada entrada del
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
 * botón "Restaurar" dibujados), así que no se envuelve en ScreenWindow. Las
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
            que un botón deshabilitado de la barra en Windows. */}
        <button
          type="button"
          onClick={() => {
            if (fileSelected) onRestore()
          }}
          aria-disabled={!fileSelected}
          aria-label="Restaurar el elemento seleccionado"
          className={`absolute rounded-sm outline-none transition-colors ${
            fileSelected
              ? "cursor-pointer hover:bg-[#cce8ff]/70 hover:shadow-[inset_0_0_0_1px_#99d1ff] focus-visible:bg-[#cce8ff]/70 focus-visible:shadow-[inset_0_0_0_1px_#99d1ff]"
              : "cursor-not-allowed"
          }`}
          style={{ left: "78.05%", top: "18.06%", width: "10.77%", height: "4.78%" }}
        />
      </div>
    </div>
  )
}

/**
 * Ventana de ADDE Labs: capturas de pantalla completas (traen su propia barra
 * de título y botón de cerrar), igual que la Papelera y Chrome, así que no se
 * envuelven en ScreenWindow. Antes de resolver el juego del archivo se ve la
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
  const [order, setOrder] = useState<string[]>(SCRAMBLED_ORDER)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [solved, setSolved] = useState(false)
  const [historyView, setHistoryView] = useState<HistoryId | null>(null)
  const [extraInfoOpen, setExtraInfoOpen] = useState(false)
  const [iaRecuperada, setIaRecuperada] = useState(false)
  const [vscodeUnlocked, setVscodeUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  const color = LAB_COLORS.CEO
  const orderCorrect = order.every((id, i) => id === CORRECT_ORDER[i].id)

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setChecked(false)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleSave() {
    setChecked(true)
    if (orderCorrect) setSolved(true)
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

      {onExit ? (
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
      <div className="pointer-events-none relative z-[55] flex h-full w-full items-center justify-center">
        {/* Escenario enmarcado, mismo marco (borde, tamaño y encuadre) que el
            retrato de las entrevistas y que la rueda de reconocimiento del
            CIDI, para mantener consistencia visual entre ámbitos. El div
            interno se ajusta exactamente a la imagen, así los hotspots de los
            íconos —definidos en % de la imagen— calzan siempre. */}
        <div
          className="pointer-events-auto relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
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
              className="max-h-[92vh] w-auto select-none rounded-[1rem] object-contain"
            />

            {!openWindow ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpenWindow("papelera")}
                  aria-label="Abrir la papelera"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.papelera}
                />
                <button
                  type="button"
                  onClick={() => setOpenWindow("labs")}
                  aria-label="Abrir ADDE Labs"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.labs}
                />
                <button
                  type="button"
                  onClick={() => setOpenWindow("chrome")}
                  aria-label="Abrir Google Chrome"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.chrome}
                />
                <button
                  type="button"
                  onClick={() => setOpenWindow("vscode")}
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

            {/* Ventana: Papelera restaurada → juego de ordenar el algoritmo, pantalla completa */}
            {openWindow === "papelera" && fileRestored ? (
              <SortAlgorithmGame
                order={order}
                dragIndex={dragIndex}
                dragOverIndex={dragOverIndex}
                checked={checked}
                orderCorrect={orderCorrect}
                solved={solved}
                onDragStart={(i) => setDragIndex(i)}
                onDragOverIndex={(i) => {
                  if (dragOverIndex !== i) setDragOverIndex(i)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                onDropIndex={handleDrop}
                onSave={handleSave}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: ADDE Labs → usa capturas (HTML_ADDE, RESTAURADA, LIBERAR) */}
            {openWindow === "labs" ? (
              <AddeLabsWindow
                solved={solved}
                extraInfoOpen={extraInfoOpen}
                onDownload={() => setExtraInfoOpen(true)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: Google Chrome → historial con 2 páginas visitadas */}
            {openWindow === "chrome" ? (
              <ChromeHistoryWindow
                view={historyView}
                onSelectHistory={(id) => setHistoryView(id)}
                onBack={() => setHistoryView(null)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: VS Code → el código real que hay que "activar" */}
            {openWindow === "vscode" ? (
              <ScreenWindow
                title={
                  vscodeUnlocked
                    ? "recuperar_ia.js - Visual Studio Code"
                    : "Visual Studio Code — Bloqueado"
                }
                onClose={closeWindow}
              >
                {!vscodeUnlocked ? (
                  <div className="relative w-full h-full bg-black text-[#d4d4d4]">
                    <Image
                      src="/images/AppBloqueada.png"
                      alt="Visual Studio Code — Aplicación bloqueada"
                      width={1672}
                      height={941}
                      className="w-full h-auto select-none object-fill"
                    />

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (passwordInput.trim().toUpperCase() === VSCODE_PASSWORD) {
                          setVscodeUnlocked(true)
                          setPasswordError(false)
                        } else {
                          setPasswordError(true)
                        }
                      }}
                      className="absolute left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value)
                          setPasswordError(false)
                        }}
                        placeholder="Contraseña"
                        aria-label="Ingresar contraseña"
                        className="w-40 rounded-md border-2 border-gray-600 bg-[#2d2d2d] px-3 py-2 text-center font-mono text-lg tracking-widest text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Desbloquear
                      </button>
                    </form>

                    {passwordError ? (
                      <p className="absolute left-1/2 bottom-20 -translate-x-1/2 font-semibold text-red-400">
                        Contraseña incorrecta.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <>
                <div className="flex bg-[#1e1e1e] text-[#d4d4d4]">
                  {/* Barra de actividad */}
                  <div className="flex w-9 shrink-0 flex-col items-center gap-4 bg-[#333333] py-3 text-base text-gray-400 sm:w-10">
                    <span aria-hidden="true">📄</span>
                    <span aria-hidden="true">🔍</span>
                    <span aria-hidden="true">⎇</span>
                  </div>
                  {/* Explorador */}
                  <div className="hidden w-32 shrink-0 flex-col bg-[#252526] px-2 py-3 sm:flex">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Explorador
                    </p>
                    <p className="rounded bg-[#37373d] px-2 py-1 text-sm text-gray-100">
                      📄 recuperar_ia.js
                    </p>
                  </div>
                  {/* Editor */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex shrink-0 items-center gap-1.5 border-b border-[#1e1e1e] bg-[#2d2d2d] px-3 py-1.5 text-sm">
                      <span aria-hidden="true">📄</span>
                      <span>recuperar_ia.js</span>
                    </div>
                    <div className="flex-1 overflow-x-auto px-3 py-3 font-mono text-sm sm:text-base">
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
                        iaRecuperada = {" "}
                        <button
                          type="button"
                          onClick={() => {
                            const next = !iaRecuperada
                            setIaRecuperada(next)
                            // Al liberar el fragmento se da por resuelto el ámbito.
                            if (next) onWin?.()
                          }}
                          className={`rounded px-1 font-bold underline decoration-dashed underline-offset-4 ${
                            iaRecuperada ? "text-[#4ec9b0]" : "text-[#569cd6]"
                          }`}
                        >
                          {iaRecuperada ? "true" : "false"}
                        </button>
                        ;
                      </CodeLine>
                      <CodeLine n={5}>&nbsp;</CodeLine>
                      <CodeLine n={6}>
                        <span className="text-[#569cd6]">function</span>{" "}
                        <span className="text-[#dcdcaa]">liberarFragmento</span>
                        () {"{"}
                      </CodeLine>
                      <CodeLine n={7}>
                        {"  "}
                        <span className="text-[#569cd6]">if</span> (
                        !iaRecuperada) {"{"}
                      </CodeLine>
                      <CodeLine n={8}>
                        {"    "}
                        <span className="text-[#569cd6]">return</span>{" "}
                        <span className="text-[#ce9178]">
                          "Esperando recuperación..."
                        </span>
                        ;
                      </CodeLine>
                      <CodeLine n={9}>{"  }"}</CodeLine>
                      <CodeLine n={10}>
                        {"  "}
                        <span className="text-[#569cd6]">return</span>{" "}
                        <span className="text-[#ce9178]">
                          "Fragmento liberado: H4CK3D"
                        </span>
                        ;
                      </CodeLine>
                      <CodeLine n={11}>{"}"}</CodeLine>
                      <CodeLine n={12}>&nbsp;</CodeLine>
                      <CodeLine n={13}>
                        <span className="text-[#dcdcaa]">console</span>.
                        <span className="text-[#dcdcaa]">log</span>(
                        liberarFragmento());
                      </CodeLine>
                    </div>
                    {/* Terminal */}
                    <div className="shrink-0 border-t border-[#1e1e1e] bg-[#181818] px-3 py-2 font-mono text-sm">
                      <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                        Terminal
                      </p>
                      <p className="text-gray-400">&gt; node recuperar_ia.js</p>
                      <p
                        className={
                          iaRecuperada
                            ? "font-bold text-[#4ec9b0]"
                            : "text-gray-500"
                        }
                      >
                        {iaRecuperada
                          ? "Fragmento liberado: H4CK3D"
                          : "Esperando recuperación..."}
                      </p>
                    </div>
                  </div>
                </div>

                {iaRecuperada ? (
                  <div className="flex flex-col items-center gap-2 border-t border-gray-200 bg-white px-4 py-4 text-center">
                    <p className="font-semibold text-blue-800">
                      Código del fragmento
                    </p>
                    <p className="rounded-md bg-gradient-to-r from-blue-600 to-pink-500 px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] text-white sm:text-3xl">
                      {FRAGMENT_CODE}
                    </p>
                    <p className="text-gray-600">
                      Anotá este código, lo van a necesitar más adelante.
                    </p>
                    <Link
                      href="/plano"
                      className="mt-1 rounded-md bg-green-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      Volver al plano
                    </Link>
                  </div>
                ) : null}
                  </>
                )}
              </ScreenWindow>
            ) : null}
          </div>
        </div>
      </div>

      {iaRecuperada ? (
        <Link
          href="/plano"
          className="absolute bottom-6 left-1/2 z-[55] -translate-x-1/2 rounded-md border-2 border-[var(--neon-green)]/80 bg-black/80 px-4 py-2 text-center font-pixel text-xs text-[var(--neon-green)] shadow-[0_0_20px_color-mix(in_oklch,var(--neon-green)_50%,transparent)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
        >
          Fragmento recuperado · Volver al plano
        </Link>
      ) : null}
    </main>
  )
}
