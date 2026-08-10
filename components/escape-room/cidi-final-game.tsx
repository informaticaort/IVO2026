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

// Los 4 pendrives repartidos por el laboratorio (Pendrives.png). Cada color
// es un ámbito y guarda su código. El jugador toca cada pendrive e ingresa la
// contraseña que recuperó en ese ámbito; con los 4 se habilita elegir culpable.
// El hotspot es la zona clickeable sobre la imagen (en % de 1672x941).
type DriveId = "hmp" | "ami" | "ceo" | "lum"

type Pendrive = {
  id: DriveId
  ambito: string
  colorName: string
  /** Color físico del pendrive, para el resaltado y el modal. */
  accent: string
  password: string
  hotspot: { left: string; top: string; width: string; height: string }
}

const PENDRIVES: Pendrive[] = [
  {
    id: "hmp",
    ambito: "HMP",
    colorName: "violeta",
    accent: "#a855f7",
    password: "MOTHERBOARD",
    hotspot: { left: "11.2%", top: "76.8%", width: "5.2%", height: "4.4%" },
  },
  {
    id: "ami",
    ambito: "AMI",
    colorName: "amarillo",
    accent: "#f5c518",
    password: "DECRYPT",
    hotspot: { left: "22.5%", top: "60.8%", width: "4.6%", height: "3.8%" },
  },
  {
    id: "ceo",
    ambito: "CEO",
    colorName: "blanco",
    accent: "#e5e7eb",
    password: "HACK3D",
    hotspot: { left: "56.3%", top: "65.3%", width: "4.6%", height: "5.0%" },
  },
  {
    id: "lum",
    ambito: "LUM",
    colorName: "rojo",
    accent: "#ef4444",
    password: "UX",
    hotspot: { left: "93.4%", top: "71.0%", width: "4.6%", height: "3.6%" },
  },
]

const PENDRIVES_IMG = "/images/Pendrives.png"

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
// Arte de la pantalla final de victoria (se genera aparte; si falta, degrada al
// fondo oscuro del contenedor).
const WON_BG = "/images/VictoriaPixelArt.png"

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
  const [unlocked, setUnlocked] = useState<Record<DriveId, boolean>>({
    hmp: false,
    ami: false,
    ceo: false,
    lum: false,
  })
  const [selectedId, setSelectedId] = useState<DriveId | null>(null)
  const [codeInput, setCodeInput] = useState("")
  const [codeError, setCodeError] = useState(false)
  const [completionLine, setCompletionLine] = useState(0)
  const [hoveredSuspectId, setHoveredSuspectId] = useState<string | null>(null)
  const [zoomedId, setZoomedId] = useState<string | null>(null)
  const [wrongMessage, setWrongMessage] = useState<string | null>(null)

  const enteredCount = PENDRIVES.filter((p) => unlocked[p.id]).length
  const selectedDrive = PENDRIVES.find((p) => p.id === selectedId) ?? null

  // Con los 4 códigos ingresados, se espera unos segundos (para que se vea
  // que quedaron completos) antes de pasar a la pantalla de carga.
  useEffect(() => {
    if (enteredCount === PENDRIVES.length && phase === "puzzle") {
      const t = setTimeout(() => setPhase("completing"), 2500)
      return () => clearTimeout(t)
    }
  }, [enteredCount, phase])

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

  function openDrive(id: DriveId) {
    if (unlocked[id]) return
    setSelectedId(id)
    setCodeInput("")
    setCodeError(false)
  }

  function submitCode() {
    if (!selectedDrive) return
    if (codeInput.trim().toUpperCase() === selectedDrive.password) {
      setUnlocked((prev) => ({ ...prev, [selectedDrive.id]: true }))
      setSelectedId(null)
    } else {
      setCodeError(true)
    }
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
      {/* Volver al plano: disponible en todo momento (CIDI es el juego final). */}
      {phase !== "won" ? (
        <Link
          href="/plano"
          className="fixed left-4 top-4 z-40 rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
        >
          Volver al plano
        </Link>
      ) : null}

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
        <div className="relative flex min-h-full items-center justify-center overflow-hidden">
          {/* Arte de fondo a pantalla completa (degrada al fondo oscuro si falta). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${WON_BG})` }}
          />
          {/* Oscurecido para que el texto se lea bien encima del arte. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[oklch(0.05_0.03_264/0.55)]"
          />

          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-10 text-center">
            <p className="flicker font-pixel text-4xl uppercase tracking-widest neon-green sm:text-6xl">
              ¡Ganaste!
            </p>
            <p className="font-pixel text-lg uppercase tracking-[0.35em] text-[var(--neon-cyan)] sm:text-2xl">
              Felicidades
            </p>
            <p className="max-w-xl rounded-lg border border-[var(--neon-green)]/40 bg-[oklch(0.08_0.04_264/0.75)] px-5 py-4 font-mono text-sm leading-relaxed text-foreground/95 backdrop-blur-sm sm:text-base">
              Desenmascararon al saboteador: Belen firmó su propio ataque con esa
              prolijidad arrogante que la delató. Con los 4 fragmentos recuperados,
              la IA quedó desinfectada y el núcleo del CIDI, asegurado. ADDE Labs
              vuelve a estar bajo control. Gran trabajo, equipo.
            </p>
            <Link
              href="/plano"
              className="rounded-md border-2 border-[var(--neon-green)]/70 bg-[oklch(0.14_0.04_264/0.7)] px-6 py-2.5 font-pixel text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
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
        /* ------------------------- PENDRIVES DEL LABORATORIO ------------------------- */
        <div className="relative flex h-full w-full items-center justify-center text-white">
          {/* Título e instrucciones flotando arriba, igual que la rueda de
              sospechosos, para que el recuadro de la imagen quede centrado a
              pantalla completa. */}
          <div className="absolute inset-x-0 top-12 z-20 px-4 text-center sm:top-16 sm:px-28">
            <p className="font-pixel text-lg uppercase tracking-widest text-[var(--neon-green)] sm:text-xl">
              Recuperen los 4 pendrives
            </p>
            <p className="mx-auto mt-2 max-w-xl rounded-md bg-black/60 px-3 py-1.5 font-mono text-sm text-white backdrop-blur-sm sm:text-base">
              Cada pendrive guarda el código de un ámbito. Toquen cada uno e
              ingresen la contraseña que recuperaron ahí.
            </p>
          </div>

          {/* Mismo marco que la rueda de sospechosos */}
          <div className="relative flex max-h-full rounded-[1.25rem] border-4 border-blue-500 p-3 sm:p-4">
            <div className="relative">
              <Image
                src={PENDRIVES_IMG}
                alt="Laboratorio con cuatro pendrives de distintos colores"
                width={1672}
                height={941}
                priority
                className="max-h-[92vh] w-auto rounded-[1rem] object-contain"
              />

              {/* Hotspots totalmente invisibles sobre cada pendrive de la
                  imagen: no se marcan de ninguna forma; solo cambia el cursor
                  para indicar que la zona es clickeable. */}
              {PENDRIVES.map((pd) => {
                const done = unlocked[pd.id]
                return (
                  <button
                    key={pd.id}
                    type="button"
                    onClick={() => openDrive(pd.id)}
                    disabled={done}
                    aria-label={
                      done
                        ? `Pendrive ${pd.colorName} (${pd.ambito}): código ingresado`
                        : `Ingresar el código del pendrive ${pd.colorName} (${pd.ambito})`
                    }
                    className={`absolute outline-none ${
                      done ? "cursor-default" : "cursor-pointer"
                    }`}
                    style={pd.hotspot}
                  />
                )
              })}
            </div>
          </div>

          {/* Progreso */}
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
            <p className="rounded-md bg-black/70 px-4 py-1.5 font-pixel text-xs text-white">
              {enteredCount} / {PENDRIVES.length} códigos ingresados
            </p>
          </div>

          {/* Modal para ingresar el código del pendrive elegido */}
          {selectedDrive ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
              onClick={() => setSelectedId(null)}
            >
              <form
                role="dialog"
                aria-label={`Código del pendrive ${selectedDrive.colorName}`}
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault()
                  submitCode()
                }}
                className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-4 bg-[oklch(0.09_0.04_264/0.96)] p-5 text-center shadow-[0_0_45px_rgba(0,0,0,0.6)]"
                style={{ borderColor: selectedDrive.accent }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-4 rounded-full border border-white/40"
                    style={{ backgroundColor: selectedDrive.accent }}
                  />
                  <p
                    className="font-pixel text-sm uppercase tracking-widest"
                    style={{ color: selectedDrive.accent }}
                  >
                    Pendrive {selectedDrive.colorName}
                  </p>
                </div>
                <p className="font-mono text-xs text-white/70">
                  Ingresá el código del ámbito {selectedDrive.ambito}.
                </p>

                <input
                  autoFocus
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase())
                    setCodeError(false)
                  }}
                  placeholder="CÓDIGO"
                  aria-label={`Código del ámbito ${selectedDrive.ambito}`}
                  aria-invalid={codeError}
                  autoComplete="off"
                  className={`w-full rounded-md border-2 bg-black/60 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-white outline-none transition-colors ${
                    codeError
                      ? "border-[var(--neon-red)]"
                      : "border-white/40 focus:border-white"
                  }`}
                />
                <p
                  aria-live="polite"
                  className={`font-mono text-xs text-[var(--neon-red)] ${
                    codeError ? "visible" : "invisible"
                  }`}
                >
                  Código incorrecto.
                </p>

                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="flex-1 rounded-md border-2 border-white/40 px-4 py-2 font-pixel text-xs text-white/80 transition-colors hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-md border-2 border-[var(--pd)] px-4 py-2 font-pixel text-xs text-[var(--pd)] transition-colors hover:bg-[var(--pd)] hover:text-black"
                    style={{ ["--pd" as string]: selectedDrive.accent }}
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
