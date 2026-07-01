import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"

type LabGamePageProps = {
  acronym: string
  // Se siguen aceptando para no romper las páginas existentes, aunque ahora
  // la vista muestre únicamente la imagen del laboratorio.
  title?: string
  description?: string
  accentClassName?: string
  children?: ReactNode
  imageSrc?: string
  imageAlt?: string
}

export function LabGamePage({
  acronym,
  children,
  imageSrc,
  imageAlt,
}: LabGamePageProps) {
  const imageSrcByAcronym: Record<string, string> = {
    AMI: "/images/AmiPixelArt.png",
    CEO: "/images/CeoPixelArt.png",
    HMP: "/images/HmpPixelArt.png",
    LUM: "/images/LumPixelArt.png",
  }

  const resolvedImageSrc = imageSrc ?? imageSrcByAcronym[acronym]
  const resolvedImageAlt = imageAlt ?? `Pixel art del laboratorio ${acronym}`

  return (
    <main className="scanlines relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      {resolvedImageSrc ? (
        <div className="relative rounded-[1.5rem] border-4 border-[var(--neon-cyan)]/70 bg-[oklch(0.09_0.04_264/0.6)] p-2 shadow-[0_0_35px_color-mix(in_oklch,var(--neon-cyan)_35%,transparent)] sm:p-3">
          <Image
            src={resolvedImageSrc}
            alt={resolvedImageAlt}
            width={960}
            height={540}
            priority
            className="max-h-[calc(100vh-3rem)] max-w-full rounded-[1rem] object-contain"
          />
        </div>
      ) : null}

      {children}

      {/* Volver al plano: botón flotante para no quedar atrapado */}
      <Link
        href="/plano"
        className="absolute left-4 top-4 z-10 rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
      >
        Volver
      </Link>
    </main>
  )
}