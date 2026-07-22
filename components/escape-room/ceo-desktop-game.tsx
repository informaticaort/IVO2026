"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { LAB_COLORS } from "./floor-plan"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO CEO — Escritorio con archivo borrado
 * La compu se "prendió" y muestra un escritorio con 3 íconos:
 *  - Papelera: captura real de Windows con un archivo borrado. Al
 *    restaurarlo se abre un juego de ordenar a pantalla completa (estilo
 *    arcade retro, sin scroll): hay que arrastrar bloques de código
 *    mezclados hasta reconstruir una función de ordenamiento válida. Al
 *    lograrlo, hay que cerrar la ventana e ir a ver ADDE Labs.
 *  - ADDE Labs: la página de la empresa se ve rota (sin estilos, con
 *    imágenes caídas) hasta que se ordena el archivo de la papelera. Una
 *    vez recuperada, muestra el logo, info básica y un link para
 *    "descargar información extra": revela el último mensaje de la IA
 *    antes de corromperse y el código del fragmento.
 *  - Google Chrome: tiene un historial con dos páginas visitadas; cada
 *    una muestra su propia información al seleccionarla.
 * Las "ventanas" se recortan dentro de la pantalla del monitor de la
 * imagen, con barra de título estilo Windows (no macOS).
 * ---------------------------------------------------------------------- */

type Step = { id: string; text: string; icon: string }

// Pasos en pseudocódigo clásico (INICIO/MIENTRAS/SI/ENTONCES/FIN) que, en
// este orden, describen el algoritmo completo para ordenar la lista
// (bubble sort) en español simple, sin sintaxis de ningún lenguaje real.
const CORRECT_ORDER: Step[] = [
  {
    id: "s1",
    icon: "🏁",
    text: "INICIO\nSuponer que todavía puede haber números para intercambiar",
  },
  {
    id: "s2",
    icon: "🔁",
    text: "MIENTRAS pueda haber cambios, HACER:\nSuponer que en esta vuelta no va a haber ningún cambio",
  },
  {
    id: "s3",
    icon: "👉",
    text: "PARA cada par de números vecinos, HACER:",
  },
  {
    id: "s4",
    icon: "❓",
    text: "SI el número de la izquierda es mayor que el de la derecha, ENTONCES:\nIntercambiar los dos números de lugar\nMarcar que en esta vuelta sí hubo un cambio",
  },
  {
    id: "s5",
    icon: "🔄",
    text: "Terminar de revisar todos los pares y volver a repetir el MIENTRAS",
  },
  {
    id: "s6",
    icon: "✅",
    text: "Cuando una vuelta completa no tuvo cambios, la lista ya está ordenada\nFIN",
  },
]

// Orden inicial mezclado: ninguna línea arranca en su lugar correcto.
const SCRAMBLED_ORDER = ["s4", "s6", "s1", "s5", "s3", "s2"]

const STEPS_BY_ID = Object.fromEntries(CORRECT_ORDER.map((s) => [s.id, s]))

type HistoryId = "delete" | "fix"

// Código de 6 caracteres que se revela al recuperar la IA en VS Code. Es la
// contraseña de la "Capa 2 · Lógica" del juego final (cidi-final-game), así
// que tiene que coincidir exactamente con la de allá.
const FRAGMENT_CODE = "HACK3D"

// Contraseña que bloqueó la IA corrupta sobre VS Code (se revela en ADDE Labs).
const VSCODE_PASSWORD = "LIBERAR"

// Posiciones de los íconos sobre Escritorio.png (en % de la imagen). Los
// cuatro están en una sola columna a la izquierda; cada área cubre el ícono
// más su etiqueta, como el rectángulo de selección de un escritorio real.
const ICONS = {
  papelera: { left: "3.11%", top: "1.91%", width: "7.18%", height: "17.21%" },
  vscode: { left: "1.50%", top: "23.59%", width: "10.35%", height: "20.83%" },
  chrome: { left: "1.08%", top: "46.55%", width: "11.18%", height: "17.43%" },
  labs: { left: "2.09%", top: "68.55%", width: "9.15%", height: "19.45%" },
}

type WindowKind = "papelera" | "labs" | "chrome" | "vscode" | null

/**
 * Línea de código con número, estilo editor. Las medidas van en cqw (ancho del
 * contenedor) porque el código se dibuja encima de VSCode_False.png: así la
 * tipografía escala junto con la imagen y siempre cae dentro del editor,
 * cualquiera sea el tamaño de la pantalla.
 */
function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-[1.5cqw]">
      <span className="w-[2cqw] shrink-0 select-none text-right text-[#6e7681]">
        {n}
      </span>
      <span className="whitespace-pre">{children}</span>
    </div>
  )
}

// Palabras del pseudocódigo que se resaltan dentro de cada tarjeta.
const PSEUDOCODE_KEYWORDS = ["INICIO", "FIN", "MIENTRAS", "HACER", "PARA", "SI", "ENTONCES"]

/** Resalta en color de acento las palabras clave del pseudocódigo dentro de una línea. */
function highlightKeywords(line: string, keyPrefix: string): React.ReactNode[] {
  const re = new RegExp(`\\b(${PSEUDOCODE_KEYWORDS.join("|")})\\b`, "g")
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = re.exec(line))) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index))
    nodes.push(
      <span key={`${keyPrefix}-${i++}`} className="font-bold neon-cyan">
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex))
  return nodes
}

/**
 * Juego de ordenar: pantalla completa con tarjetas grandes y prolijas (sin
 * scroll, se leen bien en cualquier tamaño) en vez de una ventanita de
 * "Bloc de notas". Cada tarjeta es un paso en pseudocódigo simple, en
 * español, sin sintaxis de ningún lenguaje real — pensado para gente que no
 * programa. En el orden correcto arman el algoritmo completo para ordenar
 * la lista.
 */
function SortAlgorithmGame({
  order,
  dragIndex,
  dragOverIndex,
  checked,
  orderCorrect,
  solved,
  onDragStart,
  onDragOverIndex,
  onDragEnd,
  onDropIndex,
  onSave,
  onClose,
}: {
  order: string[]
  dragIndex: number | null
  dragOverIndex: number | null
  checked: boolean
  orderCorrect: boolean
  solved: boolean
  onDragStart: (i: number) => void
  onDragOverIndex: (i: number) => void
  onDragEnd: () => void
  onDropIndex: (i: number) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background p-3 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0.1_0.04_264/0.9)_75%,oklch(0.08_0.04_264/0.97)_100%)]"
      />

      <div className="relative flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] border-4 border-[var(--neon-cyan)]/70 bg-[oklch(0.1_0.04_264/0.92)] p-4 shadow-[0_0_45px_color-mix(in_oklch,var(--neon-cyan)_35%,transparent)] sm:p-6">
        <div className="flex shrink-0 items-center justify-between gap-3 pb-3 sm:pb-4">
          <div className="min-w-0">
            <p className="truncate font-pixel text-xs uppercase tracking-[0.2em] neon-cyan sm:text-sm">
              lógica_página · algoritmo para ordenar
            </p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground sm:text-xs">
              Arrastrá los pasos (⠿) hasta que queden en el orden correcto.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border-2 border-[var(--neon-cyan)]/60 px-3 py-1.5 font-pixel text-[0.6rem] uppercase text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background sm:text-xs"
          >
            ✕ Salir
          </button>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-2.5">
          {order.map((id, i) => {
            const step = STEPS_BY_ID[id]
            const isCorrect = checked && id === CORRECT_ORDER[i].id
            const isWrong = checked && id !== CORRECT_ORDER[i].id
            const isDragging = dragIndex === i
            const isDragOver = dragOverIndex === i && dragIndex !== i
            const lines = step.text.split("\n")
            return (
              <li
                key={id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => {
                  e.preventDefault()
                  onDragOverIndex(i)
                }}
                onDragEnd={onDragEnd}
                onDrop={(e) => {
                  e.preventDefault()
                  onDropIndex(i)
                }}
                className={`flex min-h-0 flex-1 cursor-grab items-center gap-3 rounded-xl border-2 px-3 py-2 transition-colors active:cursor-grabbing sm:gap-4 sm:px-4 ${
                  isCorrect
                    ? "border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_14%,transparent)]"
                    : isWrong
                      ? "border-[var(--neon-red)] bg-[color-mix(in_oklch,var(--neon-red)_14%,transparent)]"
                      : isDragOver
                        ? "border-[var(--neon-cyan)] bg-[color-mix(in_oklch,var(--neon-cyan)_12%,transparent)]"
                        : "border-white/15 bg-white/[0.04]"
                } ${isDragging ? "opacity-40" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg text-muted-foreground sm:text-xl"
                >
                  ⠿
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-current font-pixel text-[0.65rem] text-[var(--neon-cyan)] sm:size-8 sm:text-xs">
                  {i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-xl sm:block sm:text-2xl"
                >
                  {step.icon}
                </span>
                <div className="min-w-0 flex-1 text-[clamp(0.72rem,1.3vw,1rem)] leading-snug text-foreground/90">
                  {lines.map((line, li) => (
                    <p key={li} className={li > 0 ? "mt-0.5 pl-4" : ""}>
                      {highlightKeywords(line, `${id}-${li}`)}
                    </p>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex shrink-0 flex-wrap items-center gap-3 pt-3 sm:pt-4">
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border-2 border-[var(--neon-green)] bg-[color-mix(in_oklch,var(--neon-green)_18%,transparent)] px-4 py-2 font-pixel text-[0.6rem] uppercase tracking-wide text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background sm:text-[0.7rem]"
          >
            Probar orden
          </button>
          {checked && !orderCorrect ? (
            <p className="font-mono text-[0.75rem] font-semibold text-[var(--neon-red)] sm:text-sm">
              Todavía no está bien. Seguí probando.
            </p>
          ) : null}
          {solved ? (
            <p className="font-mono text-[0.75rem] font-semibold text-[var(--neon-green)] sm:text-sm">
              ¡Listo! Cerrá esta ventana y andá a ADDE Labs.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Ventana de Google Chrome con el historial: capturas ya dibujadas (traen su
 * propia barra de título, dirección y flecha "atrás"). Ocupa todo el recuadro
 * del ámbito. Las zonas clickeables (cerrar, cada entrada del
 * historial, volver) van superpuestas como botones invisibles en las
 * coordenadas de la captura, igual que en RecycleBinWindow.
 */
function ChromeHistoryWindow({
  view,
  onSelectHistory,
  onBack,
  onClose,
}: {
  view: HistoryId | null
  onSelectHistory: (id: HistoryId) => void
  onBack: () => void
  onClose: () => void
}) {
  const image =
    view === "delete"
      ? "/images/Eliminar_Archivos.png"
      : view === "fix"
        ? "/images/Error_ADDE.png"
        : "/images/Historial.png"
  const alt =
    view === "delete"
      ? "Página: Cómo eliminar un archivo (y cómo recuperarlo)"
      : view === "fix"
        ? "Página: Cómo restaurar el error de ADDE Labs"
        : "Historial de Google Chrome con dos páginas visitadas"

  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      <div className="relative h-full w-full">
        <Image
          src={image}
          alt={alt}
          width={1672}
          height={941}
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: superpuesta sobre la X roja de la captura */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
          style={{ left: "95.6%", top: "0.9%", width: "3.6%", height: "5.8%" }}
        />

        {!view ? (
          <>
            <button
              type="button"
              onClick={() => onSelectHistory("delete")}
              aria-label="Ver página: Cómo eliminar un archivo"
              className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5"
              style={{ left: "30.7%", top: "54.6%", width: "66.2%", height: "8.9%" }}
            />
            <button
              type="button"
              onClick={() => onSelectHistory("fix")}
              aria-label="Ver página: Cómo solucionar el error de ADDE Labs"
              className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5"
              style={{ left: "30.7%", top: "63.4%", width: "66.2%", height: "8.9%" }}
            />
          </>
        ) : (
          /* Volver: superpuesta sobre la flecha "atrás" de la captura */
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al historial"
            className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5"
            style={{ left: "0.8%", top: "9.3%", width: "5%", height: "8.2%" }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Ventana de la Papelera de reciclaje: captura real de una ventana de
 * Windows en vista de íconos (ya trae su propia barra de título, ribbon y
 * botón "Restaurar" dibujados). Ocupa todo el recuadro del ámbito. Las
 * zonas clickeables (cerrar, seleccionar el archivo, restaurar) van
 * superpuestas como botones invisibles en las coordenadas de la captura.
 */
function RecycleBinWindow({
  fileSelected,
  onToggleSelect,
  onRestore,
  onClose,
}: {
  fileSelected: boolean
  onToggleSelect: () => void
  onRestore: () => void
  onClose: () => void
}) {
  return (
    // inset-0: la papelera ocupa todo el recuadro del ámbito, no el área de
    // trabajo del escritorio. Papelera.png y Escritorio.png miden lo mismo
    // (1672x941), así que la captura calza exacta sobre el escritorio y los
    // botones de abajo —en % de este div— quedan sobre sus controles reales.
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      <div className="relative h-full w-full">
        <Image
          src="/images/Papelera.png"
          alt="Papelera de reciclaje de Windows con el archivo lógica_página eliminado"
          width={1672}
          height={941}
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: superpuesta sobre la X roja de la captura. Al pasar el
            mouse se aclara, como el botón real de Windows. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
          style={{ left: "95.75%", top: "1.38%", width: "3.47%", height: "3.83%" }}
        />

        {/* Ícono + nombre del archivo eliminado: seleccionable con un clic */}
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={fileSelected}
          aria-label={
            fileSelected
              ? "lógica_página seleccionado"
              : "Seleccionar lógica_página"
          }
          className={`absolute rounded-md border-2 transition-colors ${
            fileSelected
              ? "border-[#99d1ff] bg-[#cce8ff]/70"
              : "border-transparent hover:bg-black/5"
          }`}
          style={{ left: "28.7%", top: "27.1%", width: "15.6%", height: "38.3%" }}
        />

        {/* Restaurar: superpuesta sobre el botón real de la barra de
            herramientas. Solo se resalta cuando hay algo seleccionado, igual
            que un botón deshabilitado de la barra en Windows. */}
        <button
          type="button"
          onClick={() => {
            if (fileSelected) onRestore()
          }}
          aria-disabled={!fileSelected}
          aria-label="Restaurar el elemento seleccionado"
          className={`absolute rounded-sm outline-none transition-colors ${
            fileSelected
              ? "cursor-pointer hover:bg-[#cce8ff]/70 hover:shadow-[inset_0_0_0_1px_#99d1ff] focus-visible:bg-[#cce8ff]/70 focus-visible:shadow-[inset_0_0_0_1px_#99d1ff]"
              : "cursor-not-allowed"
          }`}
          style={{ left: "78.05%", top: "18.06%", width: "10.77%", height: "4.78%" }}
        />
      </div>
    </div>
  )
}

/**
 * Ventana de ADDE Labs: capturas de pantalla completas (traen su propia barra
 * de título y botón de cerrar), igual que la Papelera y Chrome, y ocupa todo
 * el recuadro del ámbito. Antes de resolver el juego del archivo se ve la
 * página sin estilos, en HTML crudo (HTML_ADDE.png). Al resolverlo se ve el
 * sitio recuperado (RESTAURADA.png) y, al tocar "descargar información extra",
 * aparece la advertencia de la IA con la contraseña (LIBERAR.png). Las zonas
 * clickeables (cerrar, descargar) van superpuestas como botones invisibles en
 * las coordenadas de la captura.
 */
function AddeLabsWindow({
  solved,
  extraInfoOpen,
  onDownload,
  onClose,
}: {
  solved: boolean
  extraInfoOpen: boolean
  onDownload: () => void
  onClose: () => void
}) {
  const image = !solved
    ? "/images/HTML_ADDE.png"
    : extraInfoOpen
      ? "/images/LIBERAR.png"
      : "/images/RESTAURADA.png"
  const alt = !solved
    ? "Página de ADDE Labs sin estilos, mostrando el HTML crudo"
    : extraInfoOpen
      ? "Advertencia de la IA con la contraseña para desbloquear Visual Studio Code"
      : "Sitio de ADDE Labs recuperado, con un botón para descargar información extra"

  return (
    // inset-0: la ventana ocupa todo el recuadro del ámbito. Las tres capturas
    // miden 1672x941 igual que Escritorio.png, así que calzan exacto y los
    // botones —en % de este div— quedan sobre sus controles dibujados.
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      <div className="relative h-full w-full">
        <Image
          src={image}
          alt={alt}
          width={1672}
          height={941}
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: superpuesta sobre la X roja de la barra de título. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
          style={{ left: "95.1%", top: "1%", width: "4%", height: "5.5%" }}
        />

        {/* Descargar información extra: superpuesta sobre el botón del pie,
            solo en el sitio recuperado (antes de descargar). */}
        {solved && !extraInfoOpen ? (
          <button
            type="button"
            onClick={onDownload}
            aria-label="Descargar información extra"
            className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
            style={{ left: "2.3%", top: "86.3%", width: "95.3%", height: "11.3%" }}
          />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Ventana de Visual Studio Code, con el mismo formato que la Papelera, Chrome
 * y ADDE Labs: ocupa todo el recuadro del ámbito, no una ventanita chica.
 *
 * Bloqueada: se ve AppBloqueada.png (que ya trae su barra de título y su X)
 * con un campo de contraseña superpuesto en el hueco del panel; solo LIBERAR
 * desbloquea. Desbloqueada: el editor, que no es una captura sino la UI real
 * donde hay que activar la variable, así que se dibuja a pantalla completa
 * con su propia barra de título estilo VS Code.
 */
function VsCodeWindow({
  unlocked,
  passwordInput,
  passwordError,
  onPasswordChange,
  onSubmitPassword,
  iaRecuperada,
  onToggleIa,
  onClose,
}: {
  unlocked: boolean
  passwordInput: string
  passwordError: boolean
  onPasswordChange: (value: string) => void
  onSubmitPassword: () => void
  iaRecuperada: boolean
  onToggleIa: () => void
  onClose: () => void
}) {
  // El mensaje del fragmento se puede cerrar para seguir mirando el editor, y
  // se vuelve a abrir tocando "true" si necesitan releer el código.
  const [fragmentOpen, setFragmentOpen] = useState(false)

  function handleCodeClick() {
    if (!iaRecuperada) onToggleIa()
    setFragmentOpen(true)
  }

  // inset-0: mismo encuadre que el resto de las ventanas del escritorio.
  if (!unlocked) {
    return (
      <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
        <div className="relative h-full w-full">
          <Image
            src="/images/AppBloqueada.png"
            alt="Visual Studio Code bloqueado por la IA corrupta: pide una contraseña para desbloquearlo"
            width={1672}
            height={941}
            priority
            className="h-full w-full select-none object-fill"
          />

          {/* Cerrar: sobre la X roja de la barra de título dibujada. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Visual Studio Code"
            className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/30 focus-visible:bg-white/30"
            style={{ left: "93.66%", top: "1.91%", width: "5.02%", height: "6.16%" }}
          />

          {/* Contraseña: va en el hueco del panel, justo debajo del texto que
              pide ingresarla, para que se lea como parte de la pantalla. */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmitPassword()
            }}
            className="absolute left-1/2 top-[66%] flex w-[60%] -translate-x-1/2 flex-col items-center gap-3"
          >
            <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="CONTRASEÑA"
                aria-label="Contraseña para desbloquear Visual Studio Code"
                aria-invalid={passwordError}
                autoComplete="off"
                spellCheck={false}
                className={`w-1/2 min-w-0 rounded-md border-2 bg-[oklch(0.16_0.05_240/0.85)] px-3 py-2 text-center font-mono text-base uppercase tracking-[0.25em] text-[var(--neon-cyan)] outline-none transition-colors placeholder:tracking-normal placeholder:text-white/35 sm:text-lg ${
                  passwordError
                    ? "border-red-400 focus:border-red-300"
                    : "border-[var(--neon-cyan)]/60 focus:border-[var(--neon-cyan)]"
                }`}
              />
              <button
                type="submit"
                className="shrink-0 cursor-pointer rounded-md border-2 border-[var(--neon-cyan)]/70 bg-[oklch(0.16_0.05_240/0.85)] px-4 py-2 font-pixel text-[0.7rem] text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background sm:text-xs"
              >
                Desbloquear
              </button>
            </div>

            {/* aria-live: quien use lector de pantalla se entera del error. */}
            <p
              aria-live="polite"
              className={`font-mono text-sm text-red-300 sm:text-base ${
                passwordError ? "visible" : "invisible"
              }`}
            >
              Contraseña incorrecta.
            </p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-[1rem]">
      {/* @container: el código de abajo se mide en cqw, así que escala junto
          con la imagen y siempre cae dentro del editor. */}
      <div className="@container relative h-full w-full">
        <Image
          src="/images/VSCode_False.png"
          alt="Visual Studio Code abierto con el archivo recuperar_ia.js"
          width={1672}
          height={941}
          priority
          className="h-full w-full select-none object-fill"
        />

        {/* Cerrar: sobre la X roja de la barra de título dibujada. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar Visual Studio Code"
          className="absolute cursor-pointer rounded-sm outline-none transition-colors hover:bg-white/20 focus-visible:bg-white/20"
          style={{ left: "95.6%", top: "1.3%", width: "3.6%", height: "4.5%" }}
        />

        {/* El editor de la captura está vacío: el código va acá arriba, para
            que "false" se pueda tocar de verdad. */}
        <div
          className="absolute font-mono text-[1.5cqw] leading-[1.95]"
          style={{ left: "23.6%", top: "14.5%", width: "74%" }}
        >
          <CodeLine n={1}>
            <span className="text-[#6a9955]">
              // Sistema de recuperación — ADDE Labs
            </span>
          </CodeLine>
          <CodeLine n={2}>
            <span className="text-[#6a9955]">
              // Cambiá la variable para intentar recuperarla.
            </span>
          </CodeLine>
          <CodeLine n={3}>&nbsp;</CodeLine>
          <CodeLine n={4}>
            <span className="text-[#569cd6]">const</span>{" "}
            <span className="text-[#9cdcfe]">iaRecuperada</span> ={" "}
            <button
              type="button"
              onClick={handleCodeClick}
              aria-label={
                iaRecuperada
                  ? "Ver de nuevo el código del fragmento"
                  : "Cambiar iaRecuperada a true para recuperar la IA"
              }
              className={`cursor-pointer rounded px-[0.4cqw] font-bold underline decoration-dashed underline-offset-4 transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none ${
                iaRecuperada ? "text-[#4ec9b0]" : "text-[#569cd6]"
              }`}
            >
              {iaRecuperada ? "true" : "false"}
            </button>
            <span className="text-[#d4d4d4]">;</span>
          </CodeLine>
          <CodeLine n={5}>&nbsp;</CodeLine>
          <CodeLine n={6}>
            <span className="text-[#569cd6]">function</span>{" "}
            <span className="text-[#dcdcaa]">liberarFragmento</span>
            <span className="text-[#d4d4d4]">() {"{"}</span>
          </CodeLine>
          <CodeLine n={7}>
            <span className="text-[#d4d4d4]">
              {"  "}
              <span className="text-[#c586c0]">if</span> (!iaRecuperada) {"{"}
            </span>
          </CodeLine>
          <CodeLine n={8}>
            <span className="text-[#d4d4d4]">{"    "}</span>
            <span className="text-[#c586c0]">return</span>{" "}
            <span className="text-[#ce9178]">"Esperando recuperación..."</span>
            <span className="text-[#d4d4d4]">;</span>
          </CodeLine>
          <CodeLine n={9}>
            <span className="text-[#d4d4d4]">{"  }"}</span>
          </CodeLine>
          {/* El código no se puede espiar antes de tiempo: hasta que la IA no
              se recupera, el fragmento aparece tapado. */}
          <CodeLine n={10}>
            <span className="text-[#d4d4d4]">{"  "}</span>
            <span className="text-[#c586c0]">return</span>{" "}
            <span className="text-[#ce9178]">
              "Fragmento liberado:{" "}
              {iaRecuperada ? (
                FRAGMENT_CODE
              ) : (
                <span className="text-[#6e7681]">██████</span>
              )}
              "
            </span>
            <span className="text-[#d4d4d4]">;</span>
          </CodeLine>
          <CodeLine n={11}>
            <span className="text-[#d4d4d4]">{"}"}</span>
          </CodeLine>
          <CodeLine n={12}>&nbsp;</CodeLine>
          <CodeLine n={13}>
            <span className="text-[#dcdcaa]">console</span>
            <span className="text-[#d4d4d4]">.</span>
            <span className="text-[#dcdcaa]">log</span>
            <span className="text-[#d4d4d4]">(liberarFragmento());</span>
          </CodeLine>
        </div>

        {/* Salida de la terminal: la captura ya trae "Esperando
            recuperación...", así que solo se tapa cuando cambia. */}
        {iaRecuperada ? (
          <div
            className="absolute flex items-center bg-[#101113] font-mono text-[1.5cqw] font-bold text-[#4ec9b0]"
            style={{ left: "23.3%", top: "92.3%", width: "50%", height: "4.3%" }}
          >
            Fragmento liberado: {FRAGMENT_CODE}
          </div>
        ) : null}

        {fragmentOpen ? (
          <FragmentUnlockedOverlay onClose={() => setFragmentOpen(false)} />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Mensaje que tapa la pantalla al recuperar la IA, con el código del
 * fragmento. Sigue la estética del ámbito: marco neón con el color del CEO,
 * fondo oscuro translúcido y tipografía pixel, igual que las pantallas de
 * victoria del resto de los ámbitos.
 */
function FragmentUnlockedOverlay({ onClose }: { onClose: () => void }) {
  const color = LAB_COLORS.CEO

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fragmento recuperado"
      className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[1rem] bg-[oklch(0.06_0.03_264/0.92)] p-4 text-center"
    >
      <div
        className="flex w-full max-w-lg flex-col items-center gap-4 rounded-xl border-4 bg-[oklch(0.1_0.04_264/0.95)] px-5 py-6"
        style={{
          borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
          boxShadow: `0 0 45px color-mix(in oklch, ${color} 40%, transparent)`,
        }}
      >
        <p
          className="font-pixel text-lg uppercase tracking-[0.15em] sm:text-2xl"
          style={{ color }}
        >
          IA recuperada
        </p>

        <p className="font-mono text-sm leading-relaxed text-foreground/90 sm:text-base">
          El sistema volvió a responder y liberó el fragmento que la IA tenía
          retenido. El código es:
        </p>

        <p className="rounded-md bg-gradient-to-r from-blue-600 to-pink-500 px-6 py-2.5 font-mono text-3xl font-bold tracking-[0.3em] text-white sm:text-4xl">
          {FRAGMENT_CODE}
        </p>

        <p className="font-mono text-sm text-muted-foreground">
          Anotalo: lo van a necesitar para armar el núcleo de la IA.
        </p>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-1 cursor-pointer rounded-md border-2 px-5 py-2 font-pixel text-xs transition-colors hover:text-background"
          style={{
            borderColor: `color-mix(in oklch, ${color} 70%, transparent)`,
            color,
            backgroundColor: "oklch(0.14 0.04 264 / 0.7)",
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * PENSAMIENTOS DE LA INVESTIGACIÓN
 * El ámbito es una investigación, así que quien juega "piensa en voz alta":
 * un globo va comentando lo que tiene delante y qué conviene hacer después.
 * Funciona además como pista suave, para que nadie quede trabado sin saber
 * a dónde ir. Cada pensamiento tiene un id: cuando cambia el id aparece un
 * globo nuevo, y si lo cierran no vuelve hasta que cambie la situación.
 * ---------------------------------------------------------------------- */

type Thought = { id: string; text: string }

/**
 * Cosas que quien investiga ya averiguó. Se separan del avance del juego
 * porque el orden de exploración es libre: se puede abrir la papelera antes
 * de saber para qué sirve el archivo, o ver ADDE Labs rota sin saber por qué.
 * Los pensamientos no pueden dar por sabido algo que todavía no se leyó.
 */
type Discovery =
  /** Vio que Visual Studio Code está bloqueado y pide contraseña. */
  | "vscode-bloqueado"
  /** Leyó en el historial que lo borrado va a la papelera y se restaura. */
  | "como-restaurar"
  /** Leyó en el historial por qué se cayó ADDE Labs (falta el archivo). */
  | "causa-del-error"
  /** Vio con sus propios ojos la página de ADDE Labs rota. */
  | "labs-rota"
  /** Encontró un archivo eliminado en la papelera. */
  | "archivo-en-papelera"
  /** Vio la contraseña LIBERAR en la información extra de ADDE Labs. */
  | "contrasena"

type ThoughtState = {
  openWindow: WindowKind
  fileSelected: boolean
  fileRestored: boolean
  solved: boolean
  historyView: HistoryId | null
  extraInfoOpen: boolean
  vscodeUnlocked: boolean
  passwordError: boolean
  iaRecuperada: boolean
  known: Discovery[]
}

/**
 * Devuelve el pensamiento que corresponde al momento actual, mirando tanto la
 * ventana abierta como lo que ya se averiguó. La idea es que nunca "sepa" de
 * más: si todavía no leyeron el historial, el archivo de la papelera es un
 * misterio; recién después se entiende que era el de ADDE Labs.
 */
function getThought(s: ThoughtState): Thought | null {
  if (s.iaRecuperada) return null // el mensaje del fragmento ya dice todo

  const sabe = (d: Discovery) => s.known.includes(d)

  /* ------------------------------ Visual Studio Code ------------------------------ */
  if (s.openWindow === "vscode") {
    if (!s.vscodeUnlocked) {
      if (s.passwordError) {
        return {
          id: "vscode-error",
          text: "Esa no es. La contraseña tiene que estar en algún lado de esta misma computadora.",
        }
      }
      if (sabe("contrasena")) {
        return {
          id: "vscode-con-clave",
          text: "Ahora sí: la contraseña era LIBERAR.",
        }
      }
      return {
        id: "vscode-locked",
        text: "Bloqueada. La IA la trabó antes de que pudieran restaurarla… Si alguien anduvo en esta compu, algo tuvo que quedar registrado.",
      }
    }
    return {
      id: "vscode-open",
      text: "Adentro. Este código decide si la IA se recupera… y hay un false que no debería estar ahí.",
    }
  }

  /* ---------------------------------- Papelera ---------------------------------- */
  if (s.openWindow === "papelera") {
    if (s.fileRestored) {
      return {
        id: "papelera-restaurada",
        text: sabe("causa-del-error")
          ? "Listo, el archivo volvió a su lugar. Ahora ADDE Labs debería tener con qué funcionar."
          : "Listo, el archivo volvió a su lugar. Falta ver a qué página pertenecía.",
      }
    }
    if (s.fileSelected) {
      return {
        id: "papelera-seleccionado",
        text: "Seleccionado. Ahora, Restaurar.",
      }
    }
    // Lo que se piensa al ver el archivo depende de si ya se sabe qué es.
    if (sabe("causa-del-error")) {
      return {
        id: "papelera-archivo-sabe",
        text: "Ahí está: lógica_página, el archivo que le falta a ADDE Labs. Lo restauro y listo.",
      }
    }
    if (sabe("labs-rota")) {
      return {
        id: "papelera-archivo-sospecha",
        text: "Un archivo borrado: lógica_página. ¿Tendrá algo que ver con la página que se ve rota?",
      }
    }
    return {
      id: "papelera-archivo",
      text: "Alguien borró un archivo: lógica_página. Todavía no sé de dónde salió, pero acá quedó.",
    }
  }

  /* ---------------------------------- ADDE Labs ---------------------------------- */
  if (s.openWindow === "labs") {
    if (!s.solved) {
      return sabe("causa-del-error")
        ? {
            id: "labs-rota-sabe",
            text: "Tal cual decía la búsqueda: sin ese archivo la página queda en HTML pelado, sin estilos.",
          }
        : {
            id: "labs-rota",
            text: "La página de ADDE Labs se ve rota, como si le faltara todo el diseño. Alguien le sacó algo…",
          }
    }
    return s.extraInfoOpen
      ? {
          id: "labs-clave",
          text: "LIBERAR. Esa es la contraseña que necesito para Visual Studio Code.",
        }
      : {
          id: "labs-restaurada",
          text: "El sitio volvió a la normalidad. Y dejó algo para descargar… veamos esa información extra.",
        }
  }

  /* ----------------------------------- Chrome ----------------------------------- */
  if (s.openWindow === "chrome") {
    if (s.historyView === "delete") {
      return {
        id: "chrome-delete",
        text: "Lo que se borra no desaparece: queda en la papelera y se puede restaurar. Buen dato.",
      }
    }
    if (s.historyView === "fix") {
      return {
        id: "chrome-fix",
        text: "Acá está: ADDE Labs se cayó porque le borraron el archivo con las instrucciones para ordenar una lista.",
      }
    }
    return {
      id: "chrome-historial",
      text: "Dos búsquedas en el historial. Alguien estuvo averiguando justo cómo hacer todo esto…",
    }
  }

  /* ------------------------- Escritorio, sin nada abierto ------------------------- */
  // Arranca por Visual Studio Code: es el objetivo, y descubrir que está
  // bloqueado es lo que da sentido a revisar el resto de la computadora.
  if (!sabe("vscode-bloqueado")) {
    return {
      id: "escritorio-inicio",
      text: "Sabemos que hay código para recuperar, así que empecemos por lo obvio: Visual Studio Code.",
    }
  }
  if (s.vscodeUnlocked) {
    return {
      id: "escritorio-final",
      text: "Visual Studio Code ya está abierto. Falta activar la recuperación de la IA.",
    }
  }
  if (sabe("contrasena")) {
    return {
      id: "escritorio-con-clave",
      text: "Ya tengo la contraseña. A Visual Studio Code.",
    }
  }
  if (s.solved) {
    return sabe("causa-del-error") || sabe("labs-rota")
      ? {
          id: "escritorio-post-arreglo",
          text: "El archivo ya está reconstruido. Veamos cómo quedó ADDE Labs.",
        }
      : {
          id: "escritorio-post-arreglo-ciego",
          text: "El algoritmo quedó armado. Ahora habría que ver a qué página le servía todo esto.",
        }
  }
  if (s.fileRestored) {
    return {
      id: "escritorio-restaurado",
      text: "Recuperé el archivo, pero el código quedó desordenado. Hay que dejarlo en su orden correcto.",
    }
  }
  if (sabe("como-restaurar") || sabe("causa-del-error")) {
    return {
      id: "escritorio-a-papelera",
      text: "Si borraron un archivo, tiene que estar en la papelera. Vamos a buscarlo ahí.",
    }
  }
  if (sabe("archivo-en-papelera") || sabe("labs-rota")) {
    return {
      id: "escritorio-investigar",
      text: "Tengo piezas sueltas y ninguna explicación. Capaz el navegador guarde lo que estuvieron haciendo acá.",
    }
  }
  return {
    id: "escritorio-buscar-clave",
    text: "Sin la contraseña no entro. Alguien la usó desde esta compu: revisemos qué dejó abierto.",
  }
}

/** Globo de pensamiento: burbuja con la "colita" de circulitos, estilo historieta. */
function ThoughtBubble({
  text,
  onDismiss,
}: {
  text: string
  onDismiss: () => void
}) {
  const color = LAB_COLORS.CEO

  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-[56] w-[min(94%,44rem)] -translate-x-1/2">
      <div
        className="pointer-events-auto relative rounded-2xl border-2 bg-[oklch(0.09_0.04_264/0.94)] px-4 py-3 pr-10 backdrop-blur-sm"
        style={{
          borderColor: `color-mix(in oklch, ${color} 65%, transparent)`,
          boxShadow: `0 0 25px color-mix(in oklch, ${color} 30%, transparent)`,
        }}
      >
        <p className="font-mono text-sm leading-relaxed text-foreground/90 sm:text-base">
          {text}
        </p>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ocultar este pensamiento"
          className="absolute right-2 top-2 cursor-pointer rounded px-1.5 py-0.5 font-mono text-sm text-foreground/50 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        >
          ✕
        </button>

        {/* Colita del globo: dos circulitos, para que se lea como pensamiento
            y no como diálogo. */}
        <span
          aria-hidden="true"
          className="absolute -bottom-2.5 left-8 size-3 rounded-full border-2 bg-[oklch(0.09_0.04_264/0.94)]"
          style={{ borderColor: `color-mix(in oklch, ${color} 65%, transparent)` }}
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-5 left-5 size-1.5 rounded-full border-2 bg-[oklch(0.09_0.04_264/0.94)]"
          style={{ borderColor: `color-mix(in oklch, ${color} 65%, transparent)` }}
        />
      </div>
    </div>
  )
}

export function CeoDesktopGame({
  onExit,
  onWin,
}: {
  onExit?: () => void
  /** Se llama al liberar el fragmento (ganar), para marcar el ámbito resuelto. */
  onWin?: () => void
}) {
  const [openWindow, setOpenWindow] = useState<WindowKind>(null)
  const [fileSelected, setFileSelected] = useState(false)
  const [fileRestored, setFileRestored] = useState(false)
  const [order, setOrder] = useState<string[]>(SCRAMBLED_ORDER)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [solved, setSolved] = useState(false)
  const [historyView, setHistoryView] = useState<HistoryId | null>(null)
  const [extraInfoOpen, setExtraInfoOpen] = useState(false)
  const [iaRecuperada, setIaRecuperada] = useState(false)
  const [vscodeUnlocked, setVscodeUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  // Pensamientos que ya cerraron: una vez descartado, ese no vuelve a
  // aparecer, pero sí los nuevos que traiga cada avance.
  const [thoughtsDismissed, setThoughtsDismissed] = useState<string[]>([])
  // Lo que ya se averiguó, en orden libre: los pensamientos se apoyan en esto
  // para no dar por sabido algo que todavía no se leyó.
  const [known, setKnown] = useState<Discovery[]>([])

  const color = LAB_COLORS.CEO
  const orderCorrect = order.every((id, i) => id === CORRECT_ORDER[i].id)

  /** Anota un descubrimiento (sin repetirlo si ya estaba). */
  function discover(d: Discovery) {
    setKnown((prev) => (prev.includes(d) ? prev : [...prev, d]))
  }

  /** Abre una app del escritorio y anota lo que se descubre al verla. */
  function openApp(kind: Exclude<WindowKind, null>) {
    setOpenWindow(kind)
    if (kind === "papelera" && !fileRestored) discover("archivo-en-papelera")
    if (kind === "labs" && !solved) discover("labs-rota")
    if (kind === "vscode" && !vscodeUnlocked) discover("vscode-bloqueado")
  }

  const thought = getThought({
    openWindow,
    fileSelected,
    fileRestored,
    solved,
    historyView,
    extraInfoOpen,
    vscodeUnlocked,
    passwordError,
    iaRecuperada,
    known,
  })

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setChecked(false)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleSave() {
    setChecked(true)
    if (orderCorrect) setSolved(true)
  }

  /** Desbloquea VS Code solo con LIBERAR (sin distinguir mayúsculas ni espacios). */
  function handleUnlockVscode() {
    if (passwordInput.trim().toUpperCase() === VSCODE_PASSWORD) {
      setVscodeUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  /** Recuperar la IA es de ida: una vez liberada no se vuelve a false. */
  function handleRecuperarIa() {
    if (iaRecuperada) return
    setIaRecuperada(true)
    // Al liberar el fragmento se da por resuelto el ámbito.
    onWin?.()
  }

  function closeWindow() {
    setOpenWindow(null)
    setHistoryView(null)
  }

  return (
    <main className="scanlines fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background p-3 sm:p-4">
      {/* Fondo de la escena, igual al resto de los ámbitos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/cyber-bg.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.1_0.04_264/0.35)_0%,transparent_30%,oklch(0.1_0.04_264/0.85)_100%)]"
      />

      {onExit ? (
        <button
          type="button"
          onClick={onExit}
          className="absolute right-4 top-4 z-[60] rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
        >
          Salir
        </button>
      ) : null}

      {/* z-[55]: por encima de las líneas de escaneo (z-50), así las
          ventanas de la compu se leen nítidas; el resto de la escena
          (fondo cyber, botón Salir) sigue teniendo el efecto CRT. */}
      <div className="pointer-events-none relative z-[55] flex h-full w-full items-center justify-center">
        {/* Escenario enmarcado, mismo marco (borde, tamaño y encuadre) que el
            retrato de las entrevistas y que la rueda de reconocimiento del
            CIDI, para mantener consistencia visual entre ámbitos. El div
            interno se ajusta exactamente a la imagen, así los hotspots de los
            íconos —definidos en % de la imagen— calzan siempre. */}
        <div
          className="pointer-events-auto relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          <div className="relative">
            <Image
              src="/images/Escritorio.png"
              alt="Escritorio de la computadora, con la papelera, Visual Studio Code, Google Chrome y ADDE Labs"
              width={1672}
              height={941}
              priority
              className="max-h-[92vh] w-auto select-none rounded-[1rem] object-contain"
            />

            {!openWindow ? (
              <>
                <button
                  type="button"
                  onClick={() => openApp("papelera")}
                  aria-label="Abrir la papelera"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.papelera}
                />
                <button
                  type="button"
                  onClick={() => openApp("labs")}
                  aria-label="Abrir ADDE Labs"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.labs}
                />
                <button
                  type="button"
                  onClick={() => openApp("chrome")}
                  aria-label="Abrir Google Chrome"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.chrome}
                />
                <button
                  type="button"
                  onClick={() => openApp("vscode")}
                  aria-label="Abrir Visual Studio Code"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.vscode}
                />
              </>
            ) : null}

            {/* Ventana: Papelera → captura real de Windows, sin restaurar */}
            {openWindow === "papelera" && !fileRestored ? (
              <RecycleBinWindow
                fileSelected={fileSelected}
                onToggleSelect={() => setFileSelected((v) => !v)}
                onRestore={() => setFileRestored(true)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: Papelera restaurada → juego de ordenar el algoritmo, pantalla completa */}
            {openWindow === "papelera" && fileRestored ? (
              <SortAlgorithmGame
                order={order}
                dragIndex={dragIndex}
                dragOverIndex={dragOverIndex}
                checked={checked}
                orderCorrect={orderCorrect}
                solved={solved}
                onDragStart={(i) => setDragIndex(i)}
                onDragOverIndex={(i) => {
                  if (dragOverIndex !== i) setDragOverIndex(i)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                onDropIndex={handleDrop}
                onSave={handleSave}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: ADDE Labs → usa capturas (HTML_ADDE, RESTAURADA, LIBERAR) */}
            {openWindow === "labs" ? (
              <AddeLabsWindow
                solved={solved}
                extraInfoOpen={extraInfoOpen}
                onDownload={() => {
                  setExtraInfoOpen(true)
                  discover("contrasena")
                }}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: Google Chrome → historial con 2 páginas visitadas */}
            {openWindow === "chrome" ? (
              <ChromeHistoryWindow
                view={historyView}
                onSelectHistory={(id) => {
                  setHistoryView(id)
                  discover(id === "delete" ? "como-restaurar" : "causa-del-error")
                }}
                onBack={() => setHistoryView(null)}
                onClose={closeWindow}
              />
            ) : null}

            {/* Ventana: VS Code → bloqueado hasta ingresar LIBERAR, y después
                el código real que hay que "activar" */}
            {openWindow === "vscode" ? (
              <VsCodeWindow
                unlocked={vscodeUnlocked}
                passwordInput={passwordInput}
                passwordError={passwordError}
                onPasswordChange={(value) => {
                  setPasswordInput(value)
                  setPasswordError(false)
                }}
                onSubmitPassword={handleUnlockVscode}
                iaRecuperada={iaRecuperada}
                onToggleIa={handleRecuperarIa}
                onClose={closeWindow}
              />
            ) : null}

            {/* Pensamiento de quien investiga: va anclado abajo de la pantalla,
                así comenta siempre lo que se está viendo. */}
            {thought && !thoughtsDismissed.includes(thought.id) ? (
              <ThoughtBubble
                text={thought.text}
                onDismiss={() =>
                  setThoughtsDismissed((prev) => [...prev, thought.id])
                }
              />
            ) : null}
          </div>
        </div>
      </div>

      {iaRecuperada ? (
        <Link
          href="/plano"
          className="absolute bottom-6 left-1/2 z-[55] -translate-x-1/2 rounded-md border-2 border-[var(--neon-green)]/80 bg-black/80 px-4 py-2 text-center font-pixel text-xs text-[var(--neon-green)] shadow-[0_0_20px_color-mix(in_oklch,var(--neon-green)_50%,transparent)] transition-colors hover:bg-[var(--neon-green)] hover:text-background"
        >
          Fragmento recuperado · Volver al plano
        </Link>
      ) : null}
    </main>
  )
}
