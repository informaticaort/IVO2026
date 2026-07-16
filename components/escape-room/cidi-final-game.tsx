"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

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
    password: "LIBERAR",
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

type Suspect = { id: string; name: string; role: string; image: string }

const SUSPECTS: Suspect[] = [
  { id: "mica", name: "Mica", role: "AMI", image: "/images/AmiPixelArt.png" },
  { id: "valen", name: "Valen", role: "HMP", image: "/images/HmpPixelArt.png" },
  { id: "belen", name: "Belen", role: "CEO", image: "/images/CeoPixelArt.png" },
  { id: "santi", name: "Santi", role: "LUM", image: "/images/LumPixelArt.png" },
  { id: "avril", name: "Avril", role: "CIDI", image: "/images/CidiPixelArt.png" },
]

const CULPRIT_ID = "belen"

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
        <div className="relative mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center gap-6 py-6 text-white">
          <div className="text-center">
            <p className="font-pixel text-lg uppercase tracking-widest text-[var(--neon-green)] sm:text-xl">
              Identifiquen al saboteador
            </p>
            <p className="mt-2 max-w-xl font-mono text-sm text-white/80 sm:text-base">
              La IA está desinfectada. Toquen un retrato para verlo de cerca y
              confirmen la acusación cuando estén seguros.
            </p>
          </div>

          <div
            className="grid w-full grid-cols-2 gap-4 rounded-xl border-2 border-white/15 p-4 sm:grid-cols-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 24px)",
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            {SUSPECTS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openZoom(s.id)}
                className="group flex flex-col items-center gap-1.5 rounded-lg border-2 border-white/20 bg-black/30 p-2 transition-colors hover:border-[var(--neon-cyan)]/70"
              >
                <span className="relative block aspect-square w-full overflow-hidden rounded-md">
                  <Image
                    src={s.image}
                    alt={`Retrato de ${s.name}`}
                    fill
                    sizes="200px"
                    className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                  />
                </span>
                <span className="font-pixel text-[0.6rem] text-white/50">
                  SOSPECHOSO {i + 1}
                </span>
                <span className="font-mono text-sm text-white/90">{s.name}</span>
                <span className="font-mono text-[0.7rem] uppercase tracking-widest text-white/50">
                  {s.role}
                </span>
              </button>
            ))}
          </div>

          <div className="min-h-[2rem]">
            {wrongMessage ? (
              <p className="rounded-md border border-[var(--neon-red)]/50 bg-black/40 px-4 py-2 text-center font-pixel text-xs text-[var(--neon-red)]">
                {wrongMessage}
              </p>
            ) : null}
          </div>

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
                <span className="relative block aspect-square w-full overflow-hidden rounded-lg border-2 border-white/20">
                  <Image
                    src={zoomedSuspect.image}
                    alt={`Retrato ampliado de ${zoomedSuspect.name}`}
                    fill
                    sizes="360px"
                    className="object-cover object-top"
                  />
                </span>
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
