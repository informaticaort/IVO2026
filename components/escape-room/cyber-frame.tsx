import type { ReactNode } from "react"

/**
 * Marco visual compartido para todas las pantallas de la sala de escape.
 * Pinta la imagen de fondo cyberpunk, una capa oscura para contraste y
 * las líneas de escaneo tipo CRT por encima de todo.
 */
export function CyberFrame({
  children,
  contentClassName = "",
  fullWidth = false,
  fitViewport = false,
}: {
  children: ReactNode
  contentClassName?: string
  fullWidth?: boolean
  /** Ajusta el marco a la altura exacta del viewport (sin scroll). */
  fitViewport?: boolean
}) {
  const widthClass = fullWidth ? "max-w-none" : "max-w-3xl"
  // Con fitViewport el marco mide exactamente la pantalla y recorta cualquier
  // desborde; el contenido interior debe encoger (flex + min-h-0) para entrar.
  const heightClass = fitViewport ? "h-screen py-4" : "min-h-screen py-10"

  return (
    <main className={`scanlines relative flex flex-col items-center justify-center overflow-hidden bg-background px-4 ${heightClass}`}>
      {/* Imagen de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      {/* Capa oscura para legibilidad + viñeta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0.12_0.04_264/0.85)_75%,oklch(0.1_0.04_264/0.96)_100%)]"
      />
      {/* Contenido */}
      <div
        className={`relative z-10 flex w-full flex-col items-center ${widthClass} ${fitViewport ? "h-full min-h-0" : ""} ${contentClassName}`}
      >
        {children}
      </div>
    </main>
  )
}
