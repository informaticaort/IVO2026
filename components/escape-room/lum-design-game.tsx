"use client"

import { useEffect, useState, type DragEvent } from "react"
import Link from "next/link"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO LUM — Portal de ADDE Labs corrompido
 * La IA rompió la interfaz del portal interno (barra lateral, encabezado,
 * tarjetas, colores, tipografía, espaciado, orden y ancho del contenido).
 *
 * Cada aspecto de la interfaz tiene DOS herramientas con nombres neutros:
 * una acerca la interfaz al original, la otra la aleja. Ninguna etiqueta
 * delata cuál es cuál — el jugador tiene que comparar la interfaz en vivo
 * contra la interfaz original para decidir.
 *
 * Diseño a propósito "siempre ganable": la herramienta incorrecta de cada
 * par solo genera un resaltado de corrupción transitorio sobre esa parte
 * de la interfaz (se revierte solo) y nunca resta progreso de forma
 * permanente. El progreso real solo puede subir, nunca bajar, así que el
 * jugador jamás puede quedar en un estado imposible de completar.
 * ---------------------------------------------------------------------- */

const PASSWORD = "UX"

type FixKey =
  | "sidebarWidth"
  | "headerHeight"
  | "cardAlignment"
  | "buttonColors"
  | "typography"
  | "spacing"
  | "layoutOrder"
  | "contentWidth"

const FIX_TOOLS: { id: FixKey; label: string; hint: string }[] = [
  { id: "sidebarWidth", label: "Expandir panel de navegación", hint: "Aumenta el ancho de la barra lateral izquierda." },
  { id: "headerHeight", label: "Reducir altura del encabezado", hint: "Disminuye la altura de la franja superior." },
  { id: "contentWidth", label: "Ampliar ancho del contenido", hint: "Expande el panel principal para ocupar más espacio." },
  { id: "spacing", label: "Aumentar espaciado entre tarjetas", hint: "Agrega más aire entre los elementos del panel." },
  { id: "cardAlignment", label: "Alinear tarjetas a la grilla", hint: "Endereza y alinea las tarjetas del panel." },
  { id: "typography", label: "Tipografía compacta", hint: "Unifica los tamaños de texto en una escala más chica y consistente." },
  { id: "buttonColors", label: "Paleta de color sobria", hint: "Unifica los botones con la paleta de marca." },
  { id: "layoutOrder", label: "Priorizar estado de seguridad", hint: "Ubica el estado de seguridad como primera tarjeta del panel." },
]

const WRONG_TOOLS: { id: string; targetKey: FixKey; label: string; hint: string }[] = [
  { id: "sidebarWidthAlt", targetKey: "sidebarWidth", label: "Compactar panel de navegación", hint: "Reduce el ancho de la barra lateral izquierda." },
  { id: "headerHeightAlt", targetKey: "headerHeight", label: "Aumentar altura del encabezado", hint: "Incrementa la altura de la franja superior." },
  { id: "contentWidthAlt", targetKey: "contentWidth", label: "Reducir ancho del contenido", hint: "Angosta el panel principal." },
  { id: "spacingAlt", targetKey: "spacing", label: "Reducir espaciado entre tarjetas", hint: "Junta más los elementos del panel." },
  { id: "cardAlignmentAlt", targetKey: "cardAlignment", label: "Escalonar disposición de tarjetas", hint: "Desplaza y rota levemente las tarjetas del panel." },
  { id: "typographyAlt", targetKey: "typography", label: "Tipografía expandida", hint: "Agranda los tamaños de texto de forma despareja." },
  { id: "buttonColorsAlt", targetKey: "buttonColors", label: "Paleta de alto contraste", hint: "Satura los botones con colores llamativos." },
  { id: "layoutOrderAlt", targetKey: "layoutOrder", label: "Priorizar experimentos activos", hint: "Ubica los experimentos activos como primera tarjeta del panel." },
]

const ALL_FIX_KEYS = FIX_TOOLS.map((t) => t.id)
const FIX_ID_SET = new Set<string>(ALL_FIX_KEYS)
const FIX_STEP = 100 / ALL_FIX_KEYS.length

type ToolInfo = { label: string; hint: string; kind: "fix" | "wrong"; targetKey: FixKey }

const TOOL_LOOKUP: Record<string, ToolInfo> = Object.fromEntries([
  ...FIX_TOOLS.map((t) => [t.id, { label: t.label, hint: t.hint, kind: "fix" as const, targetKey: t.id }]),
  ...WRONG_TOOLS.map((t) => [t.id, { label: t.label, hint: t.hint, kind: "wrong" as const, targetKey: t.targetKey }]),
])

// Orden de exhibición: cada par (correcta/incorrecta) queda separado para
// que no se noten agrupadas ni se puedan comparar por posición en la lista.
const TOOL_DISPLAY_ORDER: string[] = [
  "sidebarWidth",
  "typographyAlt",
  "headerHeightAlt",
  "cardAlignment",
  "buttonColorsAlt",
  "contentWidth",
  "layoutOrderAlt",
  "spacing",
  "sidebarWidthAlt",
  "buttonColors",
  "cardAlignmentAlt",
  "headerHeight",
  "spacingAlt",
  "layoutOrder",
  "typography",
  "contentWidthAlt",
]

function emptyRecord<K extends string>(keys: K[]): Record<K, boolean> {
  return Object.fromEntries(keys.map((k) => [k, false])) as Record<K, boolean>
}

const NO_FIXES = emptyRecord(ALL_FIX_KEYS)
const ALL_FIXED = Object.fromEntries(ALL_FIX_KEYS.map((k) => [k, true])) as Record<FixKey, boolean>

const COMPLETION_LINES = [
  { text: "Restaurando sistema...", bar: 6 },
  { text: "Recuperando archivos encriptados...", bar: 14 },
  { text: "Acceso concedido...", bar: 15 },
]

function bar(n: number, total = 15) {
  return "█".repeat(n) + "░".repeat(Math.max(0, total - n))
}

/* --------------------------- Vista previa del portal --------------------------- */

const STAT_CARDS = [
  { id: "security", label: "Estado de Seguridad", value: "ESTABLE" },
  { id: "experiments", label: "Experimentos Activos", value: "07" },
  { id: "researchers", label: "Investigadores Activos", value: "12" },
  { id: "documents", label: "Documentos Seguros", value: "134" },
]
const ALIGNMENT_JITTER = [
  "translate(7px,-6px) rotate(-4deg)",
  "translate(-7px,6px) rotate(4deg)",
  "translate(6px,7px) rotate(3deg)",
  "translate(-6px,-7px) rotate(-3deg)",
]

const BRAND = "#0f766e"
const BRAND_DARK = "#0b5952"

function DesignPreview({
  fixes,
  activeGlitch,
}: {
  fixes: Record<FixKey, boolean>
  activeGlitch: FixKey | null
}) {
  const buttonColor = fixes.buttonColors ? BRAND : "#e11d48"
  const buttonAltColor = fixes.buttonColors ? BRAND : "#a21caf"

  const badSpacing = !fixes.spacing
  const badTypography = !fixes.typography
  const cardMisaligned = !fixes.cardAlignment
  const sidebarNarrow = !fixes.sidebarWidth
  const headerOversized = !fixes.headerHeight
  const contentTooNarrow = !fixes.contentWidth

  const statOrder = fixes.layoutOrder ? STAT_CARDS : [...STAT_CARDS].reverse()

  const ring = (key: FixKey) =>
    activeGlitch === key ? "outline outline-2 outline-[var(--neon-red)] outline-offset-2" : "outline outline-2 outline-transparent"

  return (
    <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      {/* Encabezado */}
      <div
        className={`flex items-center justify-between border-b border-slate-200 px-4 transition-all duration-200 ${ring("headerHeight")} ${
          headerOversized ? "py-7" : "py-2.5"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
            <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" fill={BRAND} />
          </svg>
          <span className="font-sans text-sm font-bold tracking-tight text-slate-800">ADDE LABS</span>
        </div>
        <div className="hidden gap-4 sm:flex">
          {["Monitoreo IA", "Experimentos", "Investigadores", "Incidentes"].map((item) => (
            <span key={item} className="text-xs font-medium text-slate-500">
              {item}
            </span>
          ))}
        </div>
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
          style={{ backgroundColor: BRAND }}
        >
          AL
        </span>
      </div>

      <div className="flex">
        {/* Barra lateral */}
        <div
          className={`flex flex-col gap-1 overflow-hidden border-r border-slate-200 bg-slate-50 py-3 transition-all duration-200 ${ring(
            "sidebarWidth",
          )} ${sidebarNarrow ? "w-6 px-0.5" : "w-24 px-2"}`}
        >
          {["Panel", "Módulos", "Diagnóstico", "Accesos"].map((item, i) => (
            <span
              key={item}
              className="truncate rounded px-1.5 py-1 text-[10px] font-medium"
              style={i === 0 ? { backgroundColor: BRAND, color: "#fff" } : { color: "#64748b" }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Contenido principal */}
        <div className={`flex-1 p-3 transition-all duration-200 ${ring("contentWidth")} ${contentTooNarrow ? "max-w-[38%]" : ""}`}>
          <p className={badTypography ? "mb-2 text-[9px] font-normal lowercase text-slate-400" : "mb-2 text-sm font-semibold text-slate-800"}>
            Monitoreo de actividad IA
          </p>

          {/* Banner */}
          <div
            className={`mb-2 rounded-lg text-white transition-all duration-200 ${ring("typography")} ${badSpacing ? "p-1" : "p-3"}`}
            style={{ backgroundImage: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}
          >
            <p className={badTypography ? "text-lg font-normal" : "text-sm font-bold"}>Estado de seguridad del sistema</p>
            <p className="text-[10px] opacity-80">Contención de IA activa — monitoreo en tiempo real.</p>
            <span
              className={`mt-2 inline-block rounded font-semibold transition-colors duration-200 ${ring("buttonColors")} ${
                badSpacing ? "px-1 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"
              }`}
              style={{ backgroundColor: buttonColor, color: "#fff" }}
            >
              Ver diagnóstico
            </span>
          </div>

          {/* Tarjetas de estado */}
          <div className={`grid grid-cols-2 transition-all duration-200 ${ring("spacing")} ${ring("cardAlignment")} ${ring("layoutOrder")} ${badSpacing ? "gap-0" : "gap-2"}`}>
            {statOrder.map((stat, pos) => (
              <div
                key={stat.id}
                className={`rounded-md border border-slate-200 bg-white transition-transform duration-200 ${badSpacing ? "p-1" : "p-2.5"}`}
                style={cardMisaligned ? { transform: ALIGNMENT_JITTER[pos] } : undefined}
              >
                <p className={badTypography ? "text-[8px] text-slate-800" : "text-[10px] text-slate-500"}>{stat.label}</p>
                <p className={badTypography ? "text-xl font-normal text-slate-800" : "text-base font-bold text-slate-800"}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de incidentes */}
        <div className={`hidden w-20 shrink-0 border-l border-slate-200 bg-white sm:block ${badSpacing ? "p-1" : "p-2.5"}`}>
          <p className="mb-1 text-[9px] font-semibold text-slate-700">Incidentes</p>
          <p className="text-[8px] leading-snug text-slate-400">La IA fue aislada del núcleo.</p>
          <span
            className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[8px] font-semibold text-white transition-colors duration-200 ${ring("buttonColors")}`}
            style={{ backgroundColor: buttonAltColor }}
          >
            Ver incidentes
          </span>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- Bloques auxiliares --------------------------------- */

function ToolButton({
  label,
  hint,
  applied,
  onApply,
  onDragStart,
}: {
  label: string
  hint: string
  applied: boolean
  onApply: () => void
  onDragStart: (e: DragEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      draggable={!applied}
      onDragStart={onDragStart}
      onClick={onApply}
      disabled={applied}
      className={`w-full rounded-md border px-2.5 py-1.5 text-left transition-colors ${
        applied
          ? "cursor-default border-white/10 bg-white/5 opacity-40"
          : "cursor-grab border-[var(--neon-cyan)]/40 bg-[oklch(0.14_0.04_264/0.6)] hover:border-[var(--neon-cyan)] hover:bg-[color-mix(in_oklch,var(--neon-cyan)_14%,transparent)]"
      }`}
    >
      <p className="font-pixel text-[0.6rem] text-white/90">{label}</p>
      <p className="font-mono text-[0.62rem] text-white/50">{hint}</p>
    </button>
  )
}

function StatusItem({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "cyan" | "yellow" }) {
  const color = { green: "var(--neon-green)", red: "var(--neon-red)", cyan: "var(--neon-cyan)", yellow: "#facc15" }[tone]
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 px-2.5 py-2">
      <span className="font-mono text-[0.7rem] text-white/70">{label}</span>
      <span className="font-pixel text-[0.62rem]" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

/* ------------------------------------ Componente ------------------------------------ */

export function LumDesignGame({ onExit }: { onExit?: () => void }) {
  const [phase, setPhase] = useState<"intro" | "playing" | "completing" | "won">("intro")
  const [fixes, setFixes] = useState<Record<FixKey, boolean>>(NO_FIXES)
  const [order, setOrder] = useState<FixKey[]>([])
  const [activeGlitch, setActiveGlitch] = useState<FixKey | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [completionLine, setCompletionLine] = useState(0)

  const correctCount = ALL_FIX_KEYS.filter((k) => fixes[k]).length
  const baseProgress = Math.round(correctCount * FIX_STEP)
  // El progreso real (baseProgress) nunca baja: una herramienta incorrecta solo
  // provoca un descenso cosmético y transitorio en la barra, nunca permanente.
  const progress = activeGlitch && baseProgress < 100 ? Math.max(0, baseProgress - 15) : baseProgress

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 2200)
    return () => clearTimeout(t)
  }, [feedback])

  useEffect(() => {
    if (!activeGlitch) return
    const t = setTimeout(() => setActiveGlitch(null), 1300)
    return () => clearTimeout(t)
  }, [activeGlitch])

  // Al llegar al 100% real se dispara la secuencia de restauración y luego la victoria.
  useEffect(() => {
    if (baseProgress === 100 && phase === "playing") setPhase("completing")
  }, [baseProgress, phase])

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

  function applyToolById(id: string) {
    const info = TOOL_LOOKUP[id]
    if (!info) return

    if (info.kind === "fix") {
      const fixId = id as FixKey
      if (fixes[fixId]) return
      setFixes((prev) => ({ ...prev, [fixId]: true }))
      setOrder((prev) => [...prev, fixId])
      setFeedback({ ok: true, text: `${info.label}: la interfaz se acerca al original.` })
      return
    }

    setActiveGlitch(info.targetKey)
    setFeedback({ ok: false, text: `${info.label}: la interfaz se aleja del original... pero se revierte solo.` })
  }

  function removeTool(id: FixKey) {
    setFixes((prev) => ({ ...prev, [id]: false }))
    setOrder((prev) => prev.filter((x) => x !== id))
  }

  function handleDragStart(e: DragEvent<HTMLButtonElement>, id: string) {
    e.dataTransfer.setData("text/plain", id)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    applyToolById(e.dataTransfer.getData("text/plain"))
  }

  const statusTone = progress === 100 ? "green" : progress >= 50 ? "yellow" : "red"
  const statusLabel = progress === 100 ? "ESTABLE" : progress >= 50 ? "INESTABLE" : "CRÍTICO"

  return (
    <div className="scanlines fixed inset-0 z-50 overflow-y-auto bg-[oklch(0.05_0.03_264)] p-3 sm:p-4">
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
        <div className="relative mx-auto flex min-h-full max-w-6xl flex-col gap-3 py-2 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-4 py-2">
            <div>
              <p className="font-pixel text-sm uppercase tracking-widest text-[var(--neon-cyan)]">
                Portal de ADDE Labs — LUM
              </p>
              <p className="font-mono text-xs text-white/60">
                La IA corrompió la interfaz. Comparen ambas versiones para decidir qué aplicar:
                los nombres no delatan cuál es correcta. Nada los puede dejar sin salida.
              </p>
            </div>
            {feedback ? (
              <p
                className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                  feedback.ok ? "border-[var(--neon-green)]/50 text-[var(--neon-green)]" : "border-[var(--neon-red)]/50 text-[var(--neon-red)]"
                }`}
              >
                {feedback.text}
              </p>
            ) : null}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_240px]">
            {/* Columna izquierda: interfaz en vivo */}
            <div className="flex min-h-0 flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-pixel text-[0.65rem] uppercase tracking-wide text-white/70">Interfaz en vivo</p>
              <DesignPreview fixes={fixes} activeGlitch={activeGlitch} />
            </div>

            {/* Columna central: herramientas de reparación */}
            <div className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-pixel text-[0.65rem] uppercase tracking-wide text-white/70">Herramientas de reparación</p>
              <p className="font-mono text-[0.68rem] text-white/50">
                Hacé clic en una herramienta o arrastrala hasta la zona de reparación.
              </p>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex min-h-[2.75rem] items-center justify-center rounded-md border-2 border-dashed border-white/20 px-2 py-2 font-mono text-[0.68rem] text-white/40"
              >
                Soltá una herramienta acá
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <ul className="flex flex-col gap-1.5">
                  {TOOL_DISPLAY_ORDER.map((id) => {
                    const tool = TOOL_LOOKUP[id]
                    return (
                      <li key={id}>
                        <ToolButton
                          label={tool.label}
                          hint={tool.hint}
                          applied={FIX_ID_SET.has(id) ? fixes[id as FixKey] : false}
                          onApply={() => applyToolById(id)}
                          onDragStart={(e) => handleDragStart(e, id)}
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div>
                <p className="mb-1 font-pixel text-[0.6rem] uppercase text-white/60">
                  Reparaciones aplicadas ({order.length})
                </p>
                <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto">
                  {order.length === 0 ? (
                    <li className="font-mono text-[0.68rem] text-white/30">Ninguna todavía.</li>
                  ) : (
                    order.map((id) => {
                      const info = TOOL_LOOKUP[id]
                      return (
                        <li key={id} className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5">
                          <span className="font-mono text-[0.7rem] text-[var(--neon-green)]">✔ {info.label}</span>
                          <button
                            type="button"
                            onClick={() => removeTool(id)}
                            className="font-pixel text-[0.6rem] text-white/50 transition-colors hover:text-white"
                            aria-label={`Quitar ${info.label}`}
                          >
                            ×
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            </div>

            {/* Columna derecha: estado del sistema */}
            <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-pixel text-[0.65rem] uppercase tracking-wide text-white/70">Estado del sistema</p>
              <StatusItem label="Integridad del sistema" value={`${progress}%`} tone={statusTone} />
              <StatusItem label="Estado del laboratorio" value={statusLabel} tone={statusTone} />
              <StatusItem
                label="Acceso a archivos"
                value={baseProgress === 100 ? "DESBLOQUEADO" : "BLOQUEADO"}
                tone={baseProgress === 100 ? "green" : "red"}
              />
              <StatusItem
                label="Restauración"
                value={`${correctCount}/${ALL_FIX_KEYS.length}`}
                tone={correctCount === ALL_FIX_KEYS.length ? "green" : "cyan"}
              />

              <div className="mt-1">
                <div className="mb-1 flex justify-between font-mono text-[0.65rem] text-white/60">
                  <span>Progreso de restauración</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress === 100 ? "var(--neon-green)" : progress >= 50 ? "#facc15" : "var(--neon-red)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------- MODAL DE INTRODUCCIÓN -------------------------- */}
          {phase === "intro" ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-4">
              <div className="flex w-full max-w-3xl flex-col gap-4 rounded-xl border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.1_0.04_264/0.97)] p-6">
                <p className="font-pixel text-lg text-[var(--neon-cyan)]">Portal de ADDE Labs corrompido</p>
                <p className="font-mono text-sm leading-relaxed text-white/85">
                  La IA corrompió por completo la interfaz del portal interno de ADDE Labs. Comparen la
                  interfaz dañada con la original y usen las Herramientas de Reparación para
                  restaurar el sistema. Los nombres de las herramientas no dicen cuál es la correcta:
                  observen bien las diferencias. Cuidado: no todas sirven, aunque ninguna puede
                  dejarlos sin salida.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-pixel text-[0.6rem] uppercase text-[var(--neon-green)]">Interfaz original</p>
                    <DesignPreview fixes={ALL_FIXED} activeGlitch={null} />
                  </div>
                  <div>
                    <p className="mb-1 font-pixel text-[0.6rem] uppercase text-[var(--neon-red)]">Interfaz corrupta actual</p>
                    <DesignPreview fixes={fixes} activeGlitch={null} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhase("playing")}
                  className="self-center rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-2 font-pixel text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
                >
                  Comenzar reparación
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
