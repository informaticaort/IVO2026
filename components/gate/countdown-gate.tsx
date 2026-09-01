"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { LockKeyhole, ShieldAlert } from "lucide-react"

/* -------------------------------------------------------------------------
 * PUERTA DE ACCESO — cuenta regresiva + clave anticipada.
 *
 * Bloquea TODO el proyecto hasta el arranque de las IVO. Cuando la cuenta
 * llega a cero se abre sola; antes de eso solo se entra con la clave
 * (para pruebas del equipo docente).
 * ---------------------------------------------------------------------- */

/** Arranque de las IVO: 02/09/2026 a las 09:20 (hora local del dispositivo). */
const UNLOCK_AT = new Date(2026, 8, 2, 9, 20, 0).getTime()

/** Clave de acceso anticipado (no distingue mayúsculas ni espacios sobrantes). */
const EARLY_ACCESS_KEY = "superclave"

/** Una vez ingresada la clave, este navegador no la vuelve a pedir. */
const UNLOCKED_STORAGE = "ivo-gate-unlocked"

type Remaining = { dias: number; horas: number; minutos: number; segundos: number }

function remainingFrom(ms: number): Remaining {
  const total = Math.max(0, ms)
  const segundos = Math.floor(total / 1000) % 60
  const minutos = Math.floor(total / 60_000) % 60
  const horas = Math.floor(total / 3_600_000) % 24
  const dias = Math.floor(total / 86_400_000)
  return { dias, horas, minutos, segundos }
}

export function CountdownGate({ children }: { children: ReactNode }) {
  // `null` = todavía no sabemos (render del servidor / antes de leer
  // localStorage). Evita parpadeos y desajustes de hidratación.
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [now, setNow] = useState(UNLOCK_AT)

  useEffect(() => {
    let recordado = false
    try {
      recordado = window.localStorage.getItem(UNLOCKED_STORAGE) === "1"
    } catch {
      /* localStorage bloqueado (modo privado): se pedirá la clave */
    }
    setNow(Date.now())
    setUnlocked(recordado || Date.now() >= UNLOCK_AT)
  }, [])

  // Reloj de 1s: solo corre mientras la puerta sigue cerrada.
  useEffect(() => {
    if (unlocked !== false) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= UNLOCK_AT) setUnlocked(true)
    }, 1000)
    return () => window.clearInterval(id)
  }, [unlocked])

  if (unlocked === null) return null
  if (unlocked) return <>{children}</>

  return (
    <LockedScreen
      remaining={remainingFrom(UNLOCK_AT - now)}
      onUnlock={() => {
        try {
          window.localStorage.setItem(UNLOCKED_STORAGE, "1")
        } catch {
          /* sin persistencia: entra igual en esta sesión */
        }
        setUnlocked(true)
      }}
    />
  )
}

function LockedScreen({
  remaining,
  onUnlock,
}: {
  remaining: Remaining
  onUnlock: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(false)

  const bloques = useMemo(
    () => [
      { label: "días", value: remaining.dias, color: "var(--neon-cyan)" },
      { label: "horas", value: remaining.horas, color: "var(--neon-green)" },
      { label: "min", value: remaining.minutos, color: "var(--neon-pink)" },
      { label: "seg", value: remaining.segundos, color: "var(--neon-red)" },
    ],
    [remaining],
  )

  return (
    <main className="scanlines relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Fondo cyberpunk compartido con el resto de las vistas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0.12_0.04_264/0.85)_75%,oklch(0.1_0.04_264/0.96)_100%)]"
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-7 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--neon-cyan)]/60 bg-[oklch(0.16_0.04_264/0.55)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[var(--neon-cyan)] shadow-[0_0_24px_color-mix(in_oklch,var(--neon-cyan)_20%,transparent)]">
          <ShieldAlert className="size-4" aria-hidden="true" />
          sistema bloqueado
        </div>

        <h1 className="glitch flicker font-pixel leading-[1.15] text-balance">
          <span className="block text-lg neon-cyan sm:text-2xl md:text-3xl">
            SE VIENEN LAS
          </span>
          <span className="neon-gradient mt-3 block text-3xl sm:text-5xl md:text-6xl">
            IVO
          </span>
          <span className="mt-3 block text-lg neon-green sm:text-2xl md:text-3xl">
            DE INFORMÁTICA
          </span>
        </h1>

        {/* Cuenta regresiva hasta la apertura */}
        <div
          className="grid w-full max-w-2xl grid-cols-4 gap-2 sm:gap-3"
          role="timer"
          aria-live="off"
        >
          {bloques.map((b) => (
            <div
              key={b.label}
              className="rounded-2xl border bg-[oklch(0.18_0.04_264/0.78)] px-2 py-4 backdrop-blur-sm sm:px-3 sm:py-5"
              style={{
                borderColor: `color-mix(in oklch, ${b.color} 35%, transparent)`,
                boxShadow: `0 0 24px color-mix(in oklch, ${b.color} 18%, transparent)`,
              }}
            >
              <p
                className="font-pixel text-xl tabular-nums sm:text-3xl md:text-4xl"
                style={{
                  color: b.color,
                  textShadow: `0 0 16px color-mix(in oklch, ${b.color} 60%, transparent)`,
                }}
              >
                {String(b.value).padStart(2, "0")}
              </p>
              <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
                {b.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
          El acceso se habilita el{" "}
          <span className="text-foreground">02/09/2026 a las 09:20</span>. Hasta
          entonces, la IA mantiene los laboratorios cerrados.
        </p>

        {/* Acceso anticipado con clave */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const value = inputRef.current?.value.trim().toLowerCase()
            if (value === EARLY_ACCESS_KEY) {
              onUnlock()
              return
            }
            setError(true)
            if (inputRef.current) inputRef.current.value = ""
            inputRef.current?.focus()
          }}
          className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-[var(--neon-green)]/30 bg-[oklch(0.11_0.04_264/0.85)] p-5 text-left backdrop-blur-sm"
        >
          <label
            htmlFor="gate-key"
            className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--neon-green)]"
          >
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            acceso anticipado
          </label>
          <input
            ref={inputRef}
            id="gate-key"
            type="password"
            autoComplete="off"
            placeholder="Contraseña"
            onChange={() => error && setError(false)}
            aria-invalid={error}
            className="w-full rounded-md border-2 border-[var(--neon-cyan)]/40 bg-[oklch(0.16_0.04_264/0.7)] px-4 py-3 font-mono text-base text-foreground outline-none focus:border-[var(--neon-cyan)] aria-[invalid=true]:border-[var(--neon-red)]"
          />
          {error && (
            <p className="font-mono text-xs neon-red" role="alert">
              Clave incorrecta. Acceso denegado.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-md border-2 border-[var(--neon-green)] bg-[var(--neon-green)] px-4 py-3 font-pixel text-sm text-background transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            DESBLOQUEAR
          </button>
        </form>
      </div>
    </main>
  )
}
