import Image from "next/image"

/* -------------------------------------------------------------------------
 * LOGO DE INFO ORT — insignia fija visible en TODAS las pantallas.
 * Se monta una sola vez en el layout raíz. Es puramente decorativo y no
 * bloquea clics (pointer-events-none), así que nunca tapa botones debajo.
 * El archivo va en public/images/InfoOrtLogo.png
 * ---------------------------------------------------------------------- */
export function InfoLogo() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[100] select-none">
      <Image
        src="/images/InfoOrtLogo.png"
        alt="INFO ORT"
        width={64}
        height={64}
        priority
        className="size-11 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:size-14"
      />
    </div>
  )
}
