"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { LAB_COLORS } from "./floor-plan"

/* -------------------------------------------------------------------------
 * JUEGO FINAL DEL ÁMBITO CIDI — Desinfección de la IA + rueda de sospechosos
 *
 * Fase 1 "puzzle": el equipo ya recuperó las 4 contraseñas de AMI, HMP, CEO
 * y LUM. Acá tienen que ubicar cada una en la capa del sistema que le
 * corresponde por tema (sin que se les diga explícitamente qué ámbito va en
 * qué capa): Interfaz, Lógica, Datos y Hardware. Es la "estructura ordenada"
 * que Avril describe en la entrevista.
 *
 * Fase 2 "lineup": con la IA desinfectada, el equipo tiene que señalar al
 * culpable en una rueda de reconocimiento estilo policial: tocan un retrato
 * para ampliarlo y confirman la acusación. Si se equivocan pueden reintentar
 * las veces que hagan falta.
 * ---------------------------------------------------------------------- */

type LayerId = "interfaz" | "logica" | "datos" | "hardware"

const LAYERS: { id: LayerId; label: string; hint: string; password: string }[] = [
  {
    id: "interfaz",
    label: "Capa 1 · Interfaz",
    hint: "Lo primero que ve el usuario: estética y experiencia.",
    password: "UX",
  },
  {
    id: "logica",
    label: "Capa 2 · Lógica",
    hint: "Las reglas y decisiones que mueven el sistema.",
    password: "HACK3D",
  },
  {
    id: "datos",
    label: "Capa 3 · Datos",
    hint: "La información guardada, la que quedó encriptada.",
    password: "DECRYPT",
  },
  {
    id: "hardware",
    label: "Capa 4 · Hardware",
    hint: "Lo que ejecuta físicamente todo el sistema.",
    password: "SINCRO",
  },
]

type Suspect = {
  id: string
  name: string
  role: keyof typeof LAB_COLORS
  /** Retrato individual de la persona (…PixelArt.png, 1024x1536), usado tanto en
   * el botón de la rueda como en el zoom de confirmación. */
  image: string
}

const SUSPECTS: Suspect[] = [
  { id: "mica", name: "Mica", role: "AMI", image: "/images/MicaPixelArt.png" },
  { id: "belen", name: "Belen", role: "CEO", image: "/images/BelenPixelArt.png" },
  { id: "valen", name: "Valen", role: "HMP", image: "/images/ValenPixelArt.png" },
  { id: "avril", name: "Avril", role: "CIDI", image: "/images/AvrilPixelArt.png" },
  { id: "santi", name: "Santi", role: "LUM", image: "/images/SantiPixelArt.png" },
]

const CULPRIT_ID = "belen"

const LINEUP_BG = "/images/FondoCulpablePixelArt.png"

const COMPLETION_LINES = [
  { text: "Validando estructura del sistema...", bar: 6 },
  { text: "Desinfectando núcleo de IA...", bar: 13 },
  { text: "Acceso al núcleo concedido...", bar: 15 },
]

function bar(n: number, total = 15) {
  return "█".repeat(n) + "░".repeat(Math.max(0, total - n))
}

type Phase = "puzzle" | "completing" | "lineup" | "won"

export function CidiFinalGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al confirmar la acusación correcta, para marcar el ámbito como resuelto. */
  onWin?: () => void
}) {
  const [phase, setPhase] = useState<Phase>("puzzle")
  const [answers, setAnswers] = useState<Record<LayerId, string>>({
    interfaz: "",
    logica: "",
    datos: "",
    hardware: "",
  })
  const [completionLine, setCompletionLine] = useState(0)
  const [hoveredSuspectId, setHoveredSuspectId] = useState<string | null>(null)
  const [zoomedId, setZoomedId] = useState<string | null>(null)
  const [wrongMessage, setWrongMessage] = useState<string | null>(null)

  const solved = LAYERS.filter(
    (l) => answers[l.id].trim().toUpperCase() === l.password
  ).length

  useEffect(() => {
    if (solved === LAYERS.length && phase === "puzzle") setPhase("completing")
  }, [solved, phase])

  useEffect(() => {
    if (phase !== "completing") return
    setCompletionLine(0)
    const timers = [
      setTimeout(() => setCompletionLine(1), 900),
      setTimeout(() => setCompletionLine(2), 1800),
      setTimeout(() => setPhase("lineup"), 2700),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase])

  function handleLayerChange(id: LayerId, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value.toUpperCase() }))
  }

  function openZoom(id: string) {
    setWrongMessage(null)
    setZoomedId(id)
  }

  function confirmAccusation() {
    if (!zoomedId) return
    if (zoomedId === CULPRIT_ID) {
      setPhase("won")
      onWin?.()
    } else {
      const suspect = SUSPECTS.find((s) => s.id === zoomedId)
      setWrongMessage(
        `No hay pruebas suficientes contra ${suspect?.name ?? "esta persona"}. Revisen bien las pistas.`
      )
      setZoomedId(null)
    }
  }

  const zoomedSuspect = SUSPECTS.find((s) => s.id === zoomedId) ?? null

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
            <p className="font-pixel text-2xl text-[var(--neon-green)]">CASO CERRADO</p>
            <p className="font-mono text-sm leading-relaxed text-foreground/95">
              El código corrupto estaba organizado con una prolijidad casi arrogante,
              como si su autora quisiera dejar en claro que era más inteligente que
              todo el equipo. Belen no pudo resistirse a firmar su propio sabotaje.
              La IA quedó desinfectada y el CIDI, asegurado.
            </p>
            <Link
              href="/plano"
              className="rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-5 py-2 font-pixel text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
            >
              Volver al plano
            </Link>
          </div>
        </div>
      ) : phase === "lineup" ? (
        /* --------------------------- RUEDA DE SOSPECHOSOS --------------------------- */
        <div className="relative flex h-full w-full items-center justify-center text-white">
          {/* Título e instrucciones flotan arriba sin ocupar espacio de layout,
              para que el recuadro de la imagen tenga el mismo tamaño (centrado
              a pantalla completa) que el retrato de las entrevistas. */}
          <div className="absolute inset-x-0 top-4 z-20 px-4 text-center sm:px-28">
            <p className="font-pixel text-lg uppercase tracking-widest text-[var(--neon-green)] sm:text-xl">
              Identifiquen al saboteador
            </p>
            <p className="mx-auto mt-2 max-w-xl rounded-md bg-black/60 px-3 py-1.5 font-mono text-sm text-white backdrop-blur-sm sm:text-base">
              La IA está desinfectada. Toquen un retrato para verlo de cerca y
              confirmen la acusación cuando estén seguros.
            </p>
          </div>

          {/* Mismo marco (borde, tamaño y encuadre) que el retrato de las
              entrevistas de cada ámbito, para mantener consistencia visual.
              La imagen invisible de abajo solo reserva el tamaño exacto del
              recuadro (igual que en la conversación de AMI); el fondo real y
              los sospechosos se dibujan encima. Cada sospechoso es su propio
              retrato: el borde de acento rodea justo esa imagen, no un
              recuadro gigante compartido. */}
          <div className="relative flex max-h-full rounded-[1.25rem] border-4 border-blue-500 p-3 sm:p-4">
            <Image
              src={LINEUP_BG}
              alt=""
              aria-hidden
              width={960}
              height={960}
              className="max-h-[92vh] w-auto rounded-[1rem] object-contain opacity-0"
            />
            <div
              className="absolute inset-0 flex items-end justify-center gap-0 overflow-hidden rounded-[1rem] bg-cover bg-center bg-no-repeat p-3 pb-32 sm:p-4 sm:pb-48"
              style={{ backgroundImage: `url(${LINEUP_BG})` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[oklch(0.09_0.04_264/0.45)]"
              />
              {SUSPECTS.map((s) => {
                const accent = LAB_COLORS[s.role]
                const isHovered = hoveredSuspectId === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openZoom(s.id)}
                    onMouseEnter={() => setHoveredSuspectId(s.id)}
                    onMouseLeave={() => setHoveredSuspectId(null)}
                    onFocus={() => setHoveredSuspectId(s.id)}
                    onBlur={() => setHoveredSuspectId(null)}
                    aria-label={`Seleccionar a ${s.name}, ámbito ${s.role}`}
                    className="relative flex h-full w-[13%] shrink-0 flex-col items-center justify-end gap-1 first:ml-0 -ml-4 sm:-ml-6"
                  >
                    {/* Los PNG son de fondo transparente: el highlight del
                        ámbito se dibuja con drop-shadow, que sigue el contorno
                        real del personaje en vez de encerrarlo en un recuadro.
                        Ancho fijo (no flex-1) para que el grupo quede más
                        junto y centrado sobre el fondo, sin estirarse de
                        punta a punta del recuadro. */}
                    <Image
                      src={s.image}
                      alt={`Retrato de ${s.name}`}
                      width={340}
                      height={510}
                      priority
                      className="max-h-full w-full object-contain transition-[filter] duration-150"
                      style={{
                        filter: isHovered
                          ? `drop-shadow(2px 0 0 ${accent}) drop-shadow(-2px 0 0 ${accent}) drop-shadow(0 2px 0 ${accent}) drop-shadow(0 -2px 0 ${accent}) drop-shadow(0 0 10px ${accent})`
                          : undefined,
                      }}
                    />
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-white">
                      {s.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {wrongMessage ? (
            <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
              <p className="rounded-md border border-[var(--neon-red)]/50 bg-black/80 px-4 py-2 text-center font-pixel text-xs text-[var(--neon-red)]">
                {wrongMessage}
              </p>
            </div>
          ) : null}

          {/* Overlay de confirmación: pixel art ampliado */}
          {zoomedSuspect ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
              onClick={() => setZoomedId(null)}
            >
              <div
                role="dialog"
                aria-label={`Confirmar acusación contra ${zoomedSuspect.name}`}
                onClick={(e) => e.stopPropagation()}
                className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-4 border-[var(--neon-cyan)]/70 bg-[oklch(0.09_0.04_264/0.95)] p-5 text-center shadow-[0_0_45px_color-mix(in_oklch,var(--neon-cyan)_35%,transparent)]"
              >
                <div className="relative w-full max-w-[220px] overflow-hidden rounded-lg border-2 border-white/20">
                  <Image
                    src={zoomedSuspect.image}
                    alt={`Retrato ampliado de ${zoomedSuspect.name}`}
                    width={340}
                    height={510}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-pixel text-lg text-[var(--neon-cyan)]">
                    {zoomedSuspect.name}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-white/60">
                    Ámbito {zoomedSuspect.role}
                  </p>
                </div>
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomedId(null)}
                    className="flex-1 rounded-md border-2 border-white/40 px-4 py-2 font-pixel text-xs text-white/80 transition-colors hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmAccusation}
                    className="flex-1 rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
                  >
                    Confirmar acusación
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : phase === "completing" ? (
        /* --------------------------- SECUENCIA DE DESINFECCIÓN --------------------------- */
        <div className="flex min-h-full items-center justify-center">
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
      ) : (
        /* ------------------------------ PUZZLE DE CAPAS ------------------------------ */
        <div className="relative mx-auto flex min-h-full max-w-3xl flex-col justify-center gap-4 py-6 text-white">
          <div className="rounded-xl border-4 border-[var(--neon-green)]/60 bg-[oklch(0.1_0.04_264/0.85)] px-4 py-3">
            <p className="font-pixel text-sm uppercase tracking-wide text-[var(--neon-green)] sm:text-base">
              Núcleo de la IA — Ensamblaje de fragmentos
            </p>
            <p className="mt-1 font-mono text-sm text-white/85 sm:text-base">
              Ubiquen cada una de las 4 contraseñas recuperadas en la capa del
              sistema que le corresponde por tema. El saboteador ordenó el
              ataque como quien ordena código: de lo más visible a lo más
              profundo.
            </p>
          </div>

          <ul className="flex flex-col gap-2">
            {LAYERS.map((layer) => {
              const value = answers[layer.id]
              const isCorrect = value !== "" && value === layer.password
              const isWrong = value !== "" && !isCorrect
              return (
                <li
                  key={layer.id}
                  className="flex flex-col gap-2 rounded-lg border border-white/20 bg-black/40 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="sm:w-48 sm:shrink-0">
                    <p className="font-pixel text-[0.78rem] uppercase tracking-wide text-white/90">
                      {layer.label}
                    </p>
                    <p className="font-mono text-[0.82rem] text-white/60">{layer.hint}</p>
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleLayerChange(layer.id, e.target.value)}
                    aria-label={`Contraseña para ${layer.label}`}
                    className={`flex-1 rounded-md border-2 bg-black/60 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] outline-none transition-colors ${
                      isCorrect
                        ? "border-[var(--neon-green)] text-[var(--neon-green)]"
                        : isWrong
                          ? "border-[var(--neon-red)]/70 text-[var(--neon-red)]"
                          : "border-white/40 text-white focus:border-white"
                    }`}
                  />
                  <span
                    className={`hidden w-6 text-center font-pixel text-lg sm:block ${
                      isCorrect ? "text-[var(--neon-green)]" : "text-white/20"
                    }`}
                  >
                    {isCorrect ? "✔" : "?"}
                  </span>
                </li>
              )
            })}
          </ul>

          <p className="text-center font-pixel text-xs text-white/60">
            {solved} / {LAYERS.length} capas verificadas
          </p>
        </div>
      )}
    </div>
  )
}
