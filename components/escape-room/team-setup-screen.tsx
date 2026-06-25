"use client"

import type { ChangeEvent } from "react"
import { useRef, useState } from "react"
import { ImagePlus, Users } from "lucide-react"
import { CyberFrame } from "./cyber-frame"

export type TeamData = {
  name: string
  avatar: string | null
}

export function TeamSetupScreen({
  onContinue,
}: {
  onContinue: (data: TeamData) => void
}) {
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const canContinue = name.trim().length > 0

  function handleSubmit() {
    if (!canContinue) return
    const teamData = { name: name.trim(), avatar }
    sessionStorage.setItem("escape-room-team", JSON.stringify(teamData))
    onContinue(teamData)
  }

  return (
    <CyberFrame>
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <h2 className="font-pixel text-xl leading-[1.4] neon-cyan text-center text-balance sm:text-2xl">
          REGISTRO DE EQUIPO
        </h2>

        {/* Carga de foto de perfil */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex size-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--neon-cyan)] bg-[oklch(0.18_0.045_264/0.6)] transition-colors hover:border-[var(--neon-green)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Cargar foto de perfil del equipo"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar || "/placeholder.svg"}
                alt="Foto de perfil del equipo"
                className="size-full object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-[var(--neon-cyan)]">
                <ImagePlus className="size-8" aria-hidden="true" />
                <span className="font-pixel text-[0.55rem] leading-relaxed">
                  SUBIR FOTO
                </span>
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          {avatar && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Cambiar foto
            </button>
          )}
        </div>

        {/* Nombre del equipo */}
        <div className="w-full space-y-2">
          <label
            htmlFor="team-name"
            className="flex items-center gap-2 font-pixel text-[0.6rem] uppercase leading-relaxed text-[var(--neon-green)]"
          >
            <Users className="size-4" aria-hidden="true" />
            Nombre del equipo
          </label>
          <input
            id="team-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit()
            }}
            placeholder="Ej: Los Cazadores de Bugs"
            maxLength={40}
            className="w-full rounded-md border-2 border-[var(--neon-cyan)]/40 bg-[oklch(0.16_0.04_264/0.7)] px-4 py-3 font-mono text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--neon-cyan)]"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue}
          className="w-full rounded-md border-2 border-[var(--neon-green)] bg-[var(--neon-green)] px-6 py-4 font-pixel text-sm text-background transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-muted disabled:bg-transparent disabled:text-muted-foreground sm:text-base"
        >
          INGRESAR
        </button>
      </div>
    </CyberFrame>
  )
}
