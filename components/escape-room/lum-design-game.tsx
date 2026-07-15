"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO LUM — Portal de ADDE Labs corrompido
 * La IA rompió la interfaz del portal interno. Antes de empezar (y cuando
 * el jugador lo pida con "VER ORIGINAL") se muestra el SISTEMA DE REFERENCIA
 * completo. Durante la reparación solo se ve la interfaz corrupta e
 * interactiva: el jugador reordena los ítems de navegación, reordena las
 * tres tarjetas, ajusta el tamaño de los elementos grandes y elige el color
 * correcto en una paleta visible. No hay controles ocultos: todo lo que se
 * puede tocar se ve que se puede tocar.
 *
 * Diseño a propósito "siempre ganable": cada propiedad puede tocarse todas
 * las veces que haga falta, en cualquier orden. El progreso se calcula como
 * propiedades correctas / total y puede subir o bajar libremente, pero
 * jamás queda en un estado sin salida.
 * ---------------------------------------------------------------------- */

const PASSWORD = "UX"

const HEADER_SIZES = ["small", "normal", "large"] as const
const TITLE_SIZES = ["small", "normal", "large"] as const
const THEMES = ["adde", "purple", "corrupted"] as const
type CardId = "monitor" | "security" | "experiments"
type NavItemId = "panel" | "modules" | "diagnostics" | "access"

type HeaderSize = (typeof HEADER_SIZES)[number]
type TitleSize = (typeof TITLE_SIZES)[number]
type Theme = (typeof THEMES)[number]

type DesignState = {
  navOrder: NavItemId[]
  cardOrder: CardId[]
  headerSize: HeaderSize
  titleSize: TitleSize
  theme: Theme
}

type PropertyKey = keyof DesignState
const PROPERTY_KEYS: PropertyKey[] = ["navOrder", "cardOrder", "headerSize", "titleSize", "theme"]

const TARGET_STATE: DesignState = {
  navOrder: ["panel", "modules", "diagnostics", "access"],
  cardOrder: ["monitor", "security", "experiments"],
  headerSize: "normal",
  titleSize: "normal",
  theme: "adde",
}

const INITIAL_STATE: DesignState = {
  navOrder: ["access", "panel", "diagnostics", "modules"],
  cardOrder: ["experiments", "monitor", "security"],
  headerSize: "large",
  titleSize: "large",
  theme: "corrupted",
}

function isCorrect(key: PropertyKey, state: DesignState): boolean {
  if (key === "cardOrder") return state.cardOrder.join(",") === TARGET_STATE.cardOrder.join(",")
  if (key === "navOrder") return state.navOrder.join(",") === TARGET_STATE.navOrder.join(",")
  return state[key] === TARGET_STATE[key]
}

const CARD_INFO: Record<CardId, { label: string; value: string }> = {
  monitor: { label: "NÚCLEO IA", value: "ACTIVO" },
  security: { label: "SEGURIDAD LAB", value: "ESTABLE" },
  experiments: { label: "EXPERIMENTOS", value: "07" },
}

const NAV_LABELS: Record<NavItemId, string> = {
  panel: "Panel",
  modules: "Módulos",
  diagnostics: "Diagnóstico",
  access: "Accesos",
}

const THEME_COLORS: Record<Theme, { base: string; dark: string }> = {
  adde: { base: "#0f766e", dark: "#0b5952" },
  purple: { base: "#7c3aed", dark: "#5b21b6" },
  corrupted: { base: "#e11d48", dark: "#9f1239" },
}

const HEADER_CLASSES: Record<HeaderSize, string> = {
  small: "py-1.5",
  normal: "py-3.5",
  large: "py-10",
}

const TITLE_CLASSES: Record<TitleSize, string> = {
  small: "text-xs font-normal text-white/70",
  normal: "text-lg font-bold text-white",
  large: "text-4xl font-black uppercase text-white",
}

const TITLE_SIZE_LABELS: Record<TitleSize, { label: string; textClass: string }> = {
  small: { label: "S", textClass: "text-xs" },
  normal: { label: "M", textClass: "text-sm" },
  large: { label: "L", textClass: "text-base" },
}

const COMPLETION_LINES = [
  { text: "Restaurando sistema...", bar: 6 },
  { text: "Recuperando archivos encriptados...", bar: 14 },
  { text: "Acceso concedido...", bar: 15 },
]

function bar(n: number, total = 15) {
  return "█".repeat(n) + "░".repeat(Math.max(0, total - n))
}

/* ------------------------------- Ícono de agarre ------------------------------- */

function GripDots({ className = "" }: { className?: string }) {
  return (
    <span className={`grid grid-cols-2 gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="size-[5px] rounded-full bg-slate-400" />
      ))}
    </span>
  )
}

/* --------------------------- Vista previa del portal --------------------------- */

function DesignPreview({
  state,
  interactive,
  pulse,
  onChange,
  onCommit,
}: {
  state: DesignState
  interactive: boolean
  pulse?: { key: PropertyKey; ok: boolean } | null
  onChange?: (patch: Partial<DesignState>) => void
  onCommit?: (key: PropertyKey, patch: Partial<DesignState>) => void
}) {
  const [draggedNav, setDraggedNav] = useState<number | null>(null)
  const [draggedCard, setDraggedCard] = useState<number | null>(null)
  const navRowRefs = useRef<(HTMLDivElement | null)[]>([])

  const theme = THEME_COLORS[state.theme]

  function pulseRing(key: PropertyKey) {
    if (!pulse || pulse.key !== key) return "outline outline-2 outline-transparent"
    return pulse.ok
      ? "outline outline-4 outline-[var(--neon-green)] outline-offset-2"
      : "outline outline-4 outline-[var(--neon-red)] outline-offset-2"
  }

  function reorderNav(fromIndex: number, toIndex: number) {
    const next = [...state.navOrder]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onChange?.({ navOrder: next })
  }

  function reorderCards(fromIndex: number, toIndex: number) {
    const next = [...state.cardOrder]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onChange?.({ cardOrder: next })
  }

  function selectTitleSize(size: TitleSize) {
    onChange?.({ titleSize: size })
    onCommit?.("titleSize", { titleSize: size })
  }

  function cycleHeaderSize() {
    const next = HEADER_SIZES[(HEADER_SIZES.indexOf(state.headerSize) + 1) % HEADER_SIZES.length]
    onChange?.({ headerSize: next })
    onCommit?.("headerSize", { headerSize: next })
  }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      {/* Encabezado */}
      <div
        className={`relative flex items-center justify-between border-b-2 border-slate-200 px-5 transition-all duration-300 ${pulseRing(
          "headerSize",
        )} ${HEADER_CLASSES[state.headerSize]}`}
      >
        <div className="flex items-center gap-2 transition-colors duration-500">
          <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0 transition-colors duration-500">
            <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" fill={theme.base} />
          </svg>
          <span className="font-sans text-lg font-extrabold tracking-tight text-slate-800">ADDE LABS</span>
        </div>
        <div className="hidden gap-5 sm:flex">
          {["Monitoreo IA", "Experimentos", "Incidentes"].map((item) => (
            <span key={item} className="text-sm font-medium text-slate-500">
              {item}
            </span>
          ))}
        </div>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-colors duration-500"
          style={{ backgroundColor: theme.base }}
        >
          AL
        </span>

        {/* Botón grande y visible para cambiar el tamaño del encabezado */}
        {interactive ? (
          <button
            type="button"
            onClick={cycleHeaderSize}
            title="Tocá para cambiar el tamaño del encabezado"
            className={`absolute left-1/2 -bottom-4 flex h-8 w-16 -translate-x-1/2 items-center justify-center gap-1 rounded-full border-2 border-slate-300 bg-white text-slate-600 shadow-md transition-transform hover:scale-110 ${pulseRing(
              "headerSize",
            )}`}
          >
            <span className="text-sm font-bold">⇕</span>
            <span className="text-[10px] font-semibold uppercase">Tamaño</span>
          </button>
        ) : null}
      </div>

      <div className="relative flex flex-row">
        {/* Panel de navegación: posición fija, ítems reordenables desde el ícono de agarre */}
        <div className={`flex w-40 flex-col gap-1 border-r-4 border-slate-200 bg-slate-50 py-4 px-2 transition-all duration-300 ${pulseRing("navOrder")}`}>
          {state.navOrder.map((navId, index) => (
            <div
              key={navId}
              ref={(el) => {
                navRowRefs.current[index] = el
              }}
              onDragEnter={() => {
                if (draggedNav === null || draggedNav === index) return
                reorderNav(draggedNav, index)
                setDraggedNav(index)
              }}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-1 rounded transition-all duration-200 ${draggedNav === index ? "opacity-40" : ""}`}
            >
              {interactive ? (
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", navId)
                    const rowEl = navRowRefs.current[index]
                    if (rowEl) e.dataTransfer.setDragImage(rowEl, 20, 14)
                    setDraggedNav(index)
                  }}
                  onDragEnd={() => {
                    setDraggedNav(null)
                    onCommit?.("navOrder", { navOrder: state.navOrder })
                  }}
                  title="Arrastrar para reordenar"
                  className="flex shrink-0 cursor-grab items-center justify-center rounded p-1 transition-colors hover:bg-slate-200 active:cursor-grabbing"
                >
                  <GripDots />
                </div>
              ) : null}
              <span
                className="flex-1 whitespace-nowrap rounded px-2 py-1.5 text-sm font-medium transition-colors duration-500"
                style={navId === "panel" ? { backgroundColor: theme.base, color: "#fff" } : { color: "#64748b" }}
              >
                {NAV_LABELS[navId]}
              </span>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-4 transition-all duration-300">
          {/* Banner */}
          <div
            className="relative mb-3 rounded-xl p-4 text-white transition-colors duration-500"
            style={{ backgroundImage: `linear-gradient(135deg, ${theme.base}, ${theme.dark})` }}
          >
            <div className={`flex flex-wrap items-center justify-between gap-2 rounded ${pulseRing("titleSize")}`}>
              <p className={`${TITLE_CLASSES[state.titleSize]}`}>Estado de seguridad del sistema</p>
              {interactive ? (
                <div className="flex items-center gap-1 rounded-md bg-black/20 p-1">
                  {TITLE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => selectTitleSize(size)}
                      title={`Tamaño de texto: ${TITLE_SIZE_LABELS[size].label}`}
                      className={`flex h-7 w-8 items-center justify-center rounded border-2 font-bold transition-all ${
                        TITLE_SIZE_LABELS[size].textClass
                      } ${
                        state.titleSize === size
                          ? "border-white bg-white/30 text-white"
                          : "border-white/30 bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {TITLE_SIZE_LABELS[size].label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="mt-1 text-sm opacity-80">Contención de IA activa — monitoreo en tiempo real.</p>
            <span
              className="mt-3 inline-block rounded px-3 py-1.5 text-sm font-semibold transition-colors duration-500"
              style={{ backgroundColor: theme.dark, color: "#fff" }}
            >
              Ver diagnóstico
            </span>
          </div>

          {/* Tarjetas reordenables */}
          <div className={`grid grid-cols-3 gap-3 transition-all duration-300 ${pulseRing("cardOrder")}`}>
            {state.cardOrder.map((cardId, index) => {
              const card = CARD_INFO[cardId]
              return (
                <div
                  key={cardId}
                  draggable={interactive}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", cardId)
                    setDraggedCard(index)
                  }}
                  onDragEnter={() => {
                    if (draggedCard === null || draggedCard === index) return
                    reorderCards(draggedCard, index)
                    setDraggedCard(index)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => {
                    setDraggedCard(null)
                    onCommit?.("cardOrder", { cardOrder: state.cardOrder })
                  }}
                  className={`relative rounded-lg border-2 border-slate-200 bg-white p-3 transition-all duration-200 ${
                    interactive ? "cursor-grab hover:-translate-y-1 hover:shadow-lg active:cursor-grabbing" : ""
                  } ${draggedCard === index ? "opacity-40" : ""}`}
                >
                  {interactive ? <GripDots className="absolute right-2 top-2" /> : null}
                  <p className="text-xs font-semibold tracking-wide text-slate-500">{card.label}</p>
                  <p className="text-2xl font-extrabold text-slate-800">{card.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- Paleta de color --------------------------------- */

function ColorPalette({
  value,
  interactive,
  pulse,
  onSelect,
}: {
  value: Theme
  interactive: boolean
  pulse?: { key: PropertyKey; ok: boolean } | null
  onSelect: (theme: Theme) => void
}) {
  const ringClass =
    pulse && pulse.key === "theme"
      ? pulse.ok
        ? "outline outline-4 outline-[var(--neon-green)] outline-offset-2"
        : "outline outline-4 outline-[var(--neon-red)] outline-offset-2"
      : "outline outline-4 outline-transparent"

  return (
    <div className={`flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3 transition-all duration-200 ${ringClass}`}>
      <p className="text-center font-pixel text-xs uppercase leading-relaxed tracking-wide text-white/70">
        Color
        <br />
        del sistema
      </p>
      <div className="flex flex-row gap-3 md:flex-col">
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect(t)}
            title="Elegir este color"
            className={`size-12 shrink-0 rounded-full border-4 shadow-md transition-transform duration-200 sm:size-14 ${
              interactive ? "hover:scale-110" : ""
            } ${value === t ? "border-white ring-4 ring-white/70" : "border-white/30"}`}
            style={{ backgroundColor: THEME_COLORS[t].base }}
          />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------ Componente ------------------------------------ */

export function LumDesignGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al restaurar el sistema al 100%, para marcar el ámbito como resuelto. */
  onWin?: () => void
}) {
  const [phase, setPhase] = useState<"playing" | "completing" | "won">("playing")
  const [designState, setDesignState] = useState<DesignState>(INITIAL_STATE)
  const [pulse, setPulse] = useState<{ key: PropertyKey; ok: boolean } | null>(null)
  const [completionLine, setCompletionLine] = useState(0)
  const [showReference, setShowReference] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  const stateRef = useRef(designState)
  useEffect(() => {
    stateRef.current = designState
  }, [designState])

  const correctCount = PROPERTY_KEYS.filter((k) => isCorrect(k, designState)).length
  const progress = Math.round((correctCount / PROPERTY_KEYS.length) * 100)

  // Al alcanzar el 100% el ámbito queda resuelto (una sola vez). Se marca acá,
  // apenas coincide el diseño, para que el monitoreo registre la completitud
  // aunque el equipo salga durante la animación de restauración.
  const wonNotified = useRef(false)
  useEffect(() => {
    if (progress === 100 && !wonNotified.current) {
      wonNotified.current = true
      onWin?.()
    }
  }, [progress, onWin])

  useEffect(() => {
    if (!pulse) return
    const t = setTimeout(() => setPulse(null), 700)
    return () => clearTimeout(t)
  }, [pulse])

  // Al llegar al 100% se dispara la secuencia de restauración y luego la victoria.
  useEffect(() => {
    if (progress === 100 && phase === "playing") setPhase("completing")
  }, [progress, phase])

  useEffect(() => {
    if (phase !== "completing") return
    setCompletionLine(0)
    const timers = [
      setTimeout(() => setCompletionLine(1), 900),
      setTimeout(() => setCompletionLine(2), 1800),
      setTimeout(() => setPhase("won"), 2700),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase])

  function handleChange(patch: Partial<DesignState>) {
    setDesignState((prev) => ({ ...prev, ...patch }))
  }

  // La corrección visual (pulso verde/rojo) siempre se calcula con isCorrect()
  // sobre el valor recién aplicado (patch), nunca sobre un estado potencialmente
  // desactualizado: así el feedback nunca puede contradecir el progreso real.
  function handleCommit(key: PropertyKey, patch: Partial<DesignState>) {
    setPulse({ key, ok: isCorrect(key, { ...stateRef.current, ...patch }) })
  }

  function selectTheme(theme: Theme) {
    handleChange({ theme })
    handleCommit("theme", { theme })
  }

  function closeReference() {
    setShowReference(false)
    setHasStarted(true)
  }

  const interactive = phase === "playing"
  const remaining = PROPERTY_KEYS.length - correctCount
  const remainingLabel =
    remaining === 0
      ? "TODOS LOS ELEMENTOS RESTAURADOS"
      : remaining === 1
        ? "1 elemento restante"
        : `${remaining} elementos restantes`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[oklch(0.05_0.03_264)] p-3 sm:p-4">
      {onExit && phase !== "won" ? (
        <button
          type="button"
          onClick={onExit}
          className="fixed right-4 top-4 z-40 rounded-md border-2 border-white/30 bg-black/60 px-4 py-2 font-pixel text-xs text-white transition-colors hover:bg-white hover:text-background"
        >
          Salir
        </button>
      ) : null}

      {phase === "won" ? (
        /* ------------------------- PANTALLA DE VICTORIA ------------------------- */
        <div className="flex min-h-full items-center justify-center">
          <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-xl border-4 border-[var(--neon-green)]/70 bg-[oklch(0.1_0.05_264/0.9)] p-8 text-center shadow-[0_0_40px_color-mix(in_oklch,var(--neon-green)_40%,transparent)]">
            <p className="font-pixel text-2xl text-[var(--neon-green)]">ARCHIVO RECUPERADO</p>
            <p className="font-mono text-sm leading-relaxed text-foreground/95">
              La IA había escondido un archivo encriptado dentro del Laboratorio de Diseño.
              El archivo fue recuperado con éxito.
            </p>
            <div className="rounded-md border-2 border-[var(--neon-green)]/60 bg-black/40 px-6 py-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-white/60">Contraseña</p>
              <p className="font-pixel text-3xl tracking-[0.3em] text-[var(--neon-green)]">{PASSWORD}</p>
            </div>
            <Link
              href="/plano"
              className="rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-2 font-pixel text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
            >
              Volver al plano
            </Link>
          </div>
        </div>
      ) : (
        /* ------------------------------ JUEGO ------------------------------ */
        <div className="relative mx-auto flex min-h-full max-w-5xl flex-col gap-2 py-1 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-4 py-2">
            <p className="font-pixel text-sm uppercase tracking-widest text-[var(--neon-cyan)] sm:text-base">
              Portal de ADDE Labs — LUM
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowReference(true)}
                disabled={!interactive}
                className="rounded-md border-2 border-[var(--neon-cyan)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-sm text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background disabled:opacity-40"
              >
                Ver original
              </button>
              <span className="font-pixel text-sm text-white/80">RESTAURACIÓN {progress}%</span>
              <div className="h-2.5 w-24 overflow-hidden rounded-full bg-white/10 sm:w-36">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: progress === 100 ? "var(--neon-green)" : progress >= 50 ? "#facc15" : "var(--neon-red)",
                  }}
                />
              </div>
              <span className={`font-mono text-sm ${remaining === 0 ? "text-[var(--neon-green)]" : "text-white/70"}`}>
                {remainingLabel}
              </span>
            </div>
          </div>

          {/* Instrucciones permanentes, siempre visibles */}
          <div className="rounded-xl border-4 border-[var(--neon-cyan)]/60 bg-[oklch(0.1_0.04_264/0.85)] px-4 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <p className="font-pixel text-sm uppercase tracking-wide text-[var(--neon-cyan)]">Cómo recuperar el sistema</p>
              <p className="font-mono text-sm text-white/90 sm:text-base">Hacé que la interfaz dañada coincida con el sistema original.</p>
            </div>
            <ul className="mt-1 grid list-disc grid-cols-1 gap-x-6 pl-5 font-mono text-sm text-white/85 sm:grid-cols-4 sm:text-base">
              <li>Arrastrá los elementos para ordenarlos correctamente.</li>
              <li>Ajustá los elementos con tamaño incorrecto.</li>
              <li>Elegí el color correcto del sistema.</li>
              <li>Usá "Ver original" cuando lo necesites.</li>
            </ul>
          </div>

          {/* TU REPARACIÓN: única interfaz visible durante el juego, a escala real. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <p className="font-pixel text-sm uppercase tracking-wide text-[var(--neon-green)]">Tu reparación</p>
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <DesignPreview
                state={designState}
                interactive={interactive}
                pulse={pulse}
                onChange={handleChange}
                onCommit={handleCommit}
              />
              <ColorPalette value={designState.theme} interactive={interactive} pulse={pulse} onSelect={selectTheme} />
            </div>
          </div>

          {/* --------------------------- SISTEMA DE REFERENCIA --------------------------- */}
          {showReference ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 p-4">
              <div className="flex max-h-[90vh] w-[90vw] max-w-[1100px] flex-col items-center gap-3 overflow-y-auto rounded-2xl border-4 border-[var(--neon-cyan)]/70 bg-[oklch(0.1_0.04_264/0.98)] p-5 text-center shadow-[0_0_50px_color-mix(in_oklch,var(--neon-cyan)_35%,transparent)]">
                <p className="font-pixel text-xl text-[var(--neon-cyan)] sm:text-2xl">SISTEMA DE REFERENCIA</p>
                <p className="font-mono text-sm text-white/80 sm:text-base">
                  La IA corrompió la interfaz de ADDE Labs. Observá bien este sistema original: vas a
                  tener que reconstruir la interfaz dañada hasta que coincida con esta referencia.
                </p>
                <div className="w-full py-2">
                  <DesignPreview state={TARGET_STATE} interactive={false} />
                </div>
                <button
                  type="button"
                  onClick={closeReference}
                  className="rounded-xl border-4 border-[var(--neon-green)]/80 bg-[oklch(0.14_0.04_264/0.7)] px-8 py-4 font-pixel text-lg text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
                >
                  {hasStarted ? "VOLVER A LA REPARACIÓN" : "COMENZAR REPARACIÓN"}
                </button>
              </div>
            </div>
          ) : null}

          {/* --------------------------- SECUENCIA DE RESTAURACIÓN --------------------------- */}
          {phase === "completing" ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 p-4">
              <div className="w-full max-w-md rounded-lg border border-[var(--neon-green)]/50 bg-black/70 p-5 font-mono text-sm text-[var(--neon-green)]">
                {COMPLETION_LINES.slice(0, completionLine + 1).map((line, i) => (
                  <p key={i} className="mb-2 whitespace-pre-line">
                    {line.text}
                    {"\n"}
                    {bar(line.bar)}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
