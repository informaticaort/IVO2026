"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { DONE_KEY_PREFIX } from "@/lib/presence/types"
import {
  LabConversation,
  isTestingMode,
  type LabConversationConfig,
} from "./lab-conversation"
import { LAB_COLORS } from "./floor-plan"
import { HmpSequenceGame } from "./hmp-sequence-game"

// Contraseña para entrar al laboratorio HMP.
const HMP_ACCESS_PASSWORD = "HMPLABS"
// Marca (por sesión) de que ya se ingresó la contraseña, para no volver a
// pedirla al ir y volver dentro de la misma partida.
const HMP_UNLOCK_KEY = "escape-room-hmp-unlocked"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO HMP — Sospechoso: VALEN (Hardware / Realidad Virtual)
 * ---------------------------------------------------------------------- */
const HMP_CONFIG: LabConversationConfig = {
  acronym: "HMP",
  speaker: "Valen",
  greeting:
    "Eh… hola. Soy Valen. Perdón, estoy medio disperso, tengo mil cosas pendientes. Pero dale, preguntá… intento ayudar, creo.",
  closingSpeech:
    "Ok, ok… arranquemos con los desafíos de realidad virtual. Conecten bien los cables y sigan las secuencias de símbolos. Sí, eso. Bastante seguro.",
  password: "MOTHERBOARD",
  completedSpeech:
    "Uf, la secuencia quedó sincronizada y el pendrive recuperó el fragmento de HMP. Ya está, bastante seguro. Podés revisar el registro de la entrevista si querés.",
  // El juego se muestra dentro del recuadro (como las entrevistas), no fullscreen.
  framedGame: true,
  questions: [
    {
      id: "q1",
      question: "Valen, ¿qué hacías a las 03:00 AM?",
      answer:
        "¿A las 03:00 AM? No sé… esperen. Sí, sí sé, creo.\n\n" +
        "Estaba en mi casa intentando terminar un informe que era para ayer. O para antes de ayer.\nNo, pará… el informe era para hoy, pero también tenía pendiente calibrar los cascos de VR.\n\n" +
        "A ver, no estuve acá. Eso seguro. O casi seguro. No, seguro.\nTengo mensajes enviados desde mi casa como a las 02:40 que dicen “ya casi termino”, que es mentira porque no terminé nada.",
    },
    {
      id: "q2",
      question: "¿Qué pasó en HMP?",
      answer:
        "Todo se desconfiguró.\n\n" +
        "Los cascos de realidad virtual muestran escenarios mezclados, los sensores responden tarde y las secuencias de símbolos aparecen en cualquier orden.\n\n" +
        "La IA convirtió el área en una especie de sala de escape dentro de la sala de escape.\nLo cual sería interesante si yo no tuviera quince cosas pendientes.",
    },
    {
      id: "q3",
      question: "¿Qué hay que resolver en esta área?",
      answer:
        "Primero tienen que conectar o identificar cables siguiendo pistas lógicas. Después tienen que resolver las secuencias de símbolos. No es al azar.\n\n" +
        "Tienen que comunicarse y trabajar juntos. Eso último parece bastante importante.\n\n" +
        "Porque si cada uno intenta resolverlo solo, van a perder tiempo. Yo ya aprendí eso por las malas.",
    },
    {
      id: "q4",
      question: "¿Viste algo raro antes de irte?",
      answer:
        "Sí. O sea, creo que sí.\n\n" +
        "Vi a Belén discutiendo con Avril por permisos de acceso. Belén decía que el sistema estaba mal diseñado y que si algo fallaba, iba a ser culpa de Avril.\n\n" +
        "Después vi a Mica intentando calmarlas. Le dijo “por favor” a la IA cuando se trabó la pantalla.\nNo sé si cuenta como raro porque Mica hace eso siempre.",
      // PISTA 7/10: antes del sabotaje ya dejaba dicho a quién había que
      // culpar si algo fallaba.
      highlights: ["si algo fallaba, iba a ser culpa de Avril"],
    },
    {
      id: "q5",
      question: "¿Creés que Avril pudo haberlo hecho?",
      answer:
        "No sé.\n\n" +
        "Avril llega tarde, se olvida reuniones, pierde cosas… pero sabotear su propio proyecto me parece mucho.\n\n" +
        "Además, si Avril quisiera romper algo, probablemente llegaría tarde también al sabotaje.\nPerdón, no debería bromear. Estoy nervioso.",
    },
    {
      id: "q6",
      question: "¿Qué pista importante tenés?",
      answer:
        "Hay algo que no me cierra.\n\n" +
        "La IA alteró primero los sistemas que podían registrar actividad: accesos, logs, sensores.\nEso parece planeado.\n\n" +
        "Y el desafío de HMP quedó intervenido de una manera muy específica, como si alguien conociera cómo usamos la realidad virtual para entrenar al equipo.\n\n" +
        "No fue un ataque cualquiera. Fue alguien de adentro.\nCasi seguro. Bueno, bastante seguro. No sé.\nAnoten “bastante seguro”.",
      // PISTA 8/10: el saboteador es del equipo y conoce cómo se usa cada área.
      highlights: ["Fue alguien de adentro"],
    },
  ],
}

/**
 * Pantalla de acceso al HMP: la puerta cerrada (HMP_CERRADO.png) con un cartel
 * que pide la contraseña. Solo HMPLABS abre. Enmarcada con el color del ámbito,
 * igual que las entrevistas.
 */
function HmpLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const color = LAB_COLORS.HMP
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)

  function submit() {
    if (value.trim().toUpperCase() === HMP_ACCESS_PASSWORD) {
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-background p-3 sm:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.1_0.04_264/0.35)_0%,transparent_30%,oklch(0.1_0.04_264/0.85)_100%)]"
      />

      <Link
        href="/plano"
        className="absolute right-4 top-4 z-40 rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
      >
        Volver
      </Link>

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <div
          className="relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          <div className="relative">
            <Image
              src="/images/HMP_CERRADO.png"
              alt="Entrada del laboratorio HMP, cerrada"
              width={1672}
              height={941}
              priority
              className="max-h-[92vh] w-auto rounded-[1rem] object-contain"
            />

            {/* Cartel de contraseña centrado sobre la escena */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
                className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-4 bg-[oklch(0.08_0.04_264/0.92)] p-5 text-center backdrop-blur-sm"
                style={{
                  borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
                  boxShadow: `0 0 30px color-mix(in oklch, ${color} 35%, transparent)`,
                }}
              >
                <p
                  className="font-pixel text-base uppercase tracking-[0.2em]"
                  style={{ color }}
                >
                  Laboratorio HMP
                </p>
                <p className="font-mono text-sm text-white/80">
                  Acceso restringido. Ingresá la contraseña para entrar.
                </p>

                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value.toUpperCase())
                    setError(false)
                  }}
                  placeholder="CONTRASEÑA"
                  aria-label="Contraseña de acceso al laboratorio HMP"
                  aria-invalid={error}
                  autoComplete="off"
                  className={`w-full rounded-md border-2 bg-black/60 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-white outline-none transition-colors ${
                    error
                      ? "border-[var(--neon-red)]"
                      : "border-white/40 focus:border-white"
                  }`}
                />
                <p
                  aria-live="polite"
                  className={`font-mono text-xs text-[var(--neon-red)] ${
                    error ? "visible" : "invisible"
                  }`}
                >
                  Contraseña incorrecta.
                </p>

                <button
                  type="submit"
                  className="w-full rounded-md border-2 px-5 py-2 font-pixel text-xs transition-colors hover:text-background"
                  style={{
                    borderColor: `color-mix(in oklch, ${color} 70%, transparent)`,
                    color,
                    backgroundColor: "oklch(0.14 0.04 264 / 0.7)",
                  }}
                >
                  Entrar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export function HmpConversation() {
  // Gate de acceso: primero la puerta cerrada con contraseña. Si el HMP ya se
  // resolvió, o ya se ingresó la contraseña en esta sesión, se entra directo.
  const [unlocked, setUnlocked] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      if (
        isTestingMode() ||
        localStorage.getItem(`${DONE_KEY_PREFIX}HMP`) ||
        sessionStorage.getItem(HMP_UNLOCK_KEY)
      ) {
        setUnlocked(true)
      }
    } catch {
      /* noop */
    }
    setReady(true)
  }, [])

  // Evita el parpadeo del cartel para quien ya tiene acceso.
  if (!ready) return null

  if (!unlocked) {
    return (
      <HmpLockScreen
        onUnlock={() => {
          try {
            sessionStorage.setItem(HMP_UNLOCK_KEY, "1")
          } catch {
            /* noop */
          }
          setUnlocked(true)
        }}
      />
    )
  }

  return (
    <LabConversation
      config={HMP_CONFIG}
      renderGame={({ exit, complete }) => (
        <HmpSequenceGame onExit={exit} onWin={complete} />
      )}
    />
  )
}
