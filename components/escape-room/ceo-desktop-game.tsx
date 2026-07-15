"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { LAB_COLORS } from "./floor-plan"

/* -------------------------------------------------------------------------
 * JUEGO DEL ÁMBITO CEO — Escritorio con archivo borrado
 * La compu se "prendió" y muestra un escritorio con 3 íconos:
 *  - Papelera: explorador de archivos con un archivo borrado. Al
 *    restaurarlo se abre como un bloc de notas con los pasos mezclados;
 *    se reordenan arrastrándolos (drag and drop). Al guardar el orden
 *    correcto, la ventana se queda tal cual: hay que cerrarla e ir a ver
 *    ADDE Labs.
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

type Step = { id: string; text: string }

const CORRECT_ORDER: Step[] = [
  { id: "s1", text: "Agarrar la lista de números tal como está, sin cambiar nada todavía." },
  { id: "s2", text: "Mirar los primeros dos números, uno al lado del otro." },
  { id: "s3", text: "Si el de la izquierda es más grande que el de la derecha, cambiarlos de lugar." },
  { id: "s4", text: "Seguir con el próximo par de números, de a dos, hasta llegar al final." },
  { id: "s5", text: "Repetir todo el proceso desde el principio, las veces que haga falta." },
  { id: "s6", text: "Cuando ya no hay que cambiar ningún número, guardar la lista: quedó ordenada." },
]

// Orden inicial mezclado: ninguna línea arranca en su lugar correcto.
const SCRAMBLED_ORDER = ["s4", "s6", "s1", "s5", "s3", "s2"]

const STEPS_BY_ID = Object.fromEntries(CORRECT_ORDER.map((s) => [s.id, s]))

const HISTORY_ENTRIES = [
  { id: "delete", title: "Cómo eliminar un archivo", time: "Hoy, 02:58", color: "bg-blue-500" },
  { id: "fix", title: "Cómo solucionar el error de ADDE Labs", time: "Hoy, 03:05", color: "bg-orange-500" },
] as const

type HistoryId = (typeof HISTORY_ENTRIES)[number]["id"]

// Código de 6 caracteres que se revela al recuperar la IA en VS Code.
const FRAGMENT_CODE = "H4CK3D"

// Contraseña que bloqueó la IA corrupta sobre VS Code (se revela en ADDE Labs).
const VSCODE_PASSWORD = "LIBERAR"

// Posiciones de los íconos sobre CeoDesktopPixelArt.png (en % de la imagen).
const ICONS = {
  papelera: { left: "11.96%", top: "11.16%", width: "6.58%", height: "12.22%" },
  labs: { left: "11.96%", top: "24.44%", width: "6.88%", height: "12.75%" },
  chrome: { left: "11.07%", top: "37.51%", width: "8.37%", height: "12.97%" },
  vscode: { left: "54.13%", top: "9.78%", width: "8.37%", height: "15.94%" },
}

// Área de la pantalla del monitor (dentro del bisel negro) sobre la misma
// imagen: ahí adentro se recortan las "ventanas" de las apps.
const SCREEN = { left: "10.41%", top: "9.25%", width: "52.81%", height: "49.95%" }

type WindowKind = "papelera" | "labs" | "chrome" | "vscode" | null

/** Línea de código con número, estilo editor. */
function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 shrink-0 select-none text-right text-[#6e7681]">{n}</span>
      <span className="whitespace-pre">{children}</span>
    </div>
  )
}

/** Barra de título estilo Windows: minimizar/maximizar decorativos + cerrar funcional. */
function ScreenWindow({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute z-10 flex items-center justify-center overflow-hidden p-3 sm:p-5"
      style={SCREEN}
    >
      {/* La ventana tiene un tamaño constante y queda centrada dentro de la
          pantalla del monitor, como una app real con un tamaño fijo. */}
      <div className="flex h-[85%] w-[85%] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-100 pl-3">
          <p className="truncate text-sm font-semibold text-gray-700 sm:text-base">
            {title}
          </p>
          <div className="flex h-8 shrink-0 sm:h-9">
            <span
              aria-hidden="true"
              className="flex w-9 items-center justify-center text-gray-600 hover:bg-gray-200 sm:w-10"
            >
              &#x2013;
            </span>
            <span
              aria-hidden="true"
              className="flex w-9 items-center justify-center text-[0.7rem] text-gray-600 hover:bg-gray-200 sm:w-10"
            >
              &#x25A1;
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="flex w-9 items-center justify-center text-gray-600 transition-colors hover:bg-red-500 hover:text-white sm:w-10"
            >
              &#x2715;
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white text-base leading-snug sm:text-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

export function CeoDesktopGame({ onExit }: { onExit?: () => void }) {
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

  const color = LAB_COLORS.CEO
  const orderCorrect = order.every((id, i) => id === CORRECT_ORDER[i].id)

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
          className="absolute right-4 top-4 z-40 rounded-md border-2 border-[var(--neon-cyan)]/60 bg-[oklch(0.14_0.04_264/0.7)] px-4 py-2 font-pixel text-xs text-[var(--neon-cyan)] transition-colors hover:bg-[var(--neon-cyan)] hover:text-background"
        >
          Salir
        </button>
      ) : null}

      {/* z-[55]: por encima de las líneas de escaneo (z-50), así las
          ventanas de la compu se leen nítidas; el resto de la escena
          (fondo cyber, botón Salir) sigue teniendo el efecto CRT. */}
      <div className="pointer-events-none relative z-[55] flex h-full w-full items-center justify-center">
        {/* Escenario enmarcado, igual al de las conversaciones */}
        <div
          className="pointer-events-auto relative flex max-h-full rounded-[1.25rem] border-4 bg-[oklch(0.09_0.04_264/0.55)] p-3 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${color} 75%, transparent)`,
            boxShadow: `0 0 35px color-mix(in oklch, ${color} 35%, transparent)`,
          }}
        >
          <div className="relative">
            <Image
              src="/images/CeoDesktopPixelArt.png"
              alt="Escritorio de la computadora, con la papelera, ADDE Labs y Google Chrome"
              width={1672}
              height={941}
              priority
              className="max-h-[92vh] w-auto select-none rounded-[1rem] object-contain"
            />

            {!openWindow ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpenWindow("papelera")}
                  aria-label="Abrir la papelera"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.papelera}
                />
                <button
                  type="button"
                  onClick={() => setOpenWindow("labs")}
                  aria-label="Abrir ADDE Labs"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.labs}
                />
                <button
                  type="button"
                  onClick={() => setOpenWindow("chrome")}
                  aria-label="Abrir Google Chrome"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.chrome}
                />
                <button
                  type="button"
                  onClick={() => setOpenWindow("vscode")}
                  aria-label="Abrir Visual Studio Code"
                  className="absolute cursor-pointer rounded-md outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  style={ICONS.vscode}
                />
              </>
            ) : null}

            {/* Ventana: Papelera → explorador de archivos / bloc de notas */}
            {openWindow === "papelera" ? (
              <ScreenWindow
                title={
                  fileRestored
                    ? "instrucciones_ordenar.txt - Bloc de notas"
                    : "Papelera de reciclaje"
                }
                onClose={closeWindow}
              >
                {!fileRestored ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
                      <button
                        type="button"
                        disabled={!fileSelected}
                        onClick={() => setFileRestored(true)}
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold text-white transition-colors enabled:bg-blue-600 enabled:hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        <span aria-hidden="true">↺</span> Restaurar el elemento seleccionado
                      </button>
                    </div>
                    <div className="border-b border-gray-200 bg-amber-50 px-2 py-1.5 font-medium text-amber-800">
                      🗑️ Papelera de reciclaje
                    </div>
                    <div className="grid grid-cols-[1fr_90px_60px] gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      <span>Nombre</span>
                      <span>Eliminado</span>
                      <span>Tamaño</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFileSelected(true)}
                      className={`grid w-full grid-cols-[1fr_90px_60px] items-center gap-1 px-2 py-2 text-left transition-colors ${
                        fileSelected ? "bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate text-gray-800">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-sky-500 text-xs font-bold text-white">
                          TXT
                        </span>
                        instrucciones_ordenar.txt
                      </span>
                      <span className="text-gray-500">Hoy</span>
                      <span className="text-gray-500">2 KB</span>
                    </button>
                    <p className="px-2 py-2 text-gray-400">
                      {fileSelected
                        ? "Elemento seleccionado. Ahora podés restaurarlo."
                        : "Hacé clic en el archivo para seleccionarlo."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 p-3">
                    <p className="leading-relaxed text-gray-700">
                      Este archivo tiene los pasos para ordenar una lista de
                      números, pero quedaron mezclados. Arrastrá cada paso
                      (con el ⠿) hasta el orden correcto.
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {order.map((id, i) => {
                        const step = STEPS_BY_ID[id]
                        const isCorrect = checked && id === CORRECT_ORDER[i].id
                        const isWrong = checked && id !== CORRECT_ORDER[i].id
                        const isDragging = dragIndex === i
                        const isDragOver = dragOverIndex === i && dragIndex !== i
                        return (
                          <li
                            key={id}
                            draggable
                            onDragStart={() => setDragIndex(i)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              if (dragOverIndex !== i) setDragOverIndex(i)
                            }}
                            onDragEnd={() => {
                              setDragIndex(null)
                              setDragOverIndex(null)
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              handleDrop(i)
                            }}
                            className={`flex cursor-grab items-center gap-2 rounded-lg border-2 px-2 py-2 transition-colors active:cursor-grabbing ${
                              isCorrect
                                ? "border-green-500 bg-green-50 text-green-800"
                                : isWrong
                                  ? "border-red-400 bg-red-50 text-red-700"
                                  : isDragOver
                                    ? "border-indigo-500 bg-indigo-100"
                                    : "border-indigo-200 bg-indigo-50/60 text-gray-800"
                            } ${isDragging ? "opacity-40" : ""}`}
                          >
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-lg leading-none text-gray-400"
                            >
                              ⠿
                            </span>
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                              {i + 1}
                            </span>
                            <span className="flex-1">{step.text}</span>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Guardar orden
                      </button>
                      {checked && !orderCorrect ? (
                        <p className="font-semibold text-red-600">
                          Todavía no está bien. Seguí probando.
                        </p>
                      ) : null}
                      {solved ? (
                        <p className="font-semibold text-green-700">
                          ¡Listo! Cerrá esta ventana y andá a ADDE Labs.
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </ScreenWindow>
            ) : null}

            {/* Ventana: ADDE Labs → página rota hasta que se resuelve el archivo */}
            {openWindow === "labs" ? (
              <ScreenWindow title="ADDE Labs — Google Chrome" onClose={closeWindow}>
                <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-2 py-1.5">
                  <span className="rounded-full bg-white px-2.5 py-1 text-sm text-gray-500">
                    adde-labs.local
                  </span>
                </div>

                {!solved ? (
                  <div
                    className="bg-white px-3 py-3 text-black"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    <p className="mb-2 font-sans text-sm text-gray-400">
                      index.html — no se pudo cargar el estilo de la página
                    </p>
                    <h1 className="mb-2 text-2xl font-normal underline sm:text-3xl">
                      ADDE Labs
                    </h1>
                    <p className="mb-2">
                      Bienvenidos a la mejor empresa de tecnología.{" "}
                      &lt;h2&gt;Innovación todos los días&lt;/h2&gt;
                    </p>
                    <div className="mb-2 flex size-12 items-center justify-center border border-gray-400 text-xl text-gray-400">
                      🖼️
                    </div>
                    <p className="text-blue-700 underline">Sobre nosotros</p>
                    <p className="mb-2 text-blue-700 underline">Contacto</p>
                    <p className="text-red-600">
                      {
                        "{{ ERROR: faltan las instrucciones para ordenar la información — archivo no encontrado }}"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col bg-white">
                    {/* Nav */}
                    <div className="flex items-center justify-between border-b border-sky-100 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-pink-400 text-xs font-black text-white">
                          AL
                        </div>
                        <span className="font-bold text-gray-800">ADDE Labs</span>
                      </div>
                      <div className="hidden gap-4 text-sm font-medium text-sky-900/40 sm:flex">
                        <span>Inicio</span>
                        <span>Equipo</span>
                        <span>Contacto</span>
                      </div>
                    </div>

                    {/* Hero */}
                    <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-pink-400 px-5 py-7 text-center text-white">
                      <p className="text-2xl font-extrabold sm:text-3xl">
                        Bienvenidos a ADDE Labs
                      </p>
                      <p className="mt-1 text-white/90">
                        Investigación, inteligencia artificial y prototipos
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 font-semibold">
                        ✅ Sitio recuperado
                      </p>
                    </div>

                    {/* Sobre nosotros */}
                    <div className="grid grid-cols-3 gap-2 px-4 py-4">
                      <div className="rounded-xl border border-sky-100 bg-sky-50 p-2.5 text-center">
                        <p className="text-2xl">🔬</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          Investigación
                        </p>
                      </div>
                      <div className="rounded-xl border border-pink-100 bg-pink-50 p-2.5 text-center">
                        <p className="text-2xl">🤖</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          Inteligencia&nbsp;artificial
                        </p>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-center">
                        <p className="text-2xl">💡</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          Prototipos
                        </p>
                      </div>
                    </div>

                    <p className="px-4 pb-2 leading-relaxed text-gray-700">
                      ADDE Labs es el área de investigación de la empresa: acá
                      se prueban ideas nuevas, se entrenan modelos de
                      inteligencia artificial y se arman los prototipos que
                      después usan el resto de los equipos.
                    </p>

                    {/* Recursos / descarga */}
                    <div className="mx-4 my-3 rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-pink-50 p-4">
                      {!extraInfoOpen ? (
                        <button
                          type="button"
                          onClick={() => setExtraInfoOpen(true)}
                          className="inline-flex w-fit items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-pink-500 px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          📎 Hacé clic para descargar información extra
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-gray-500">
                            📥 recuperar_ia.js descargado.
                          </p>
                          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
                            <p className="mb-1 font-bold text-amber-800">
                              ⚠ Advertencia de la IA
                            </p>
                            <p className="leading-relaxed text-amber-900">
                              "Antes de que me corrompan, bloqueé Visual
                              Studio Code para protegerme. Esta es la
                              contraseña para desbloquearlo:"
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-blue-300 bg-white px-4 py-3 text-center">
                            <p className="rounded-md bg-gradient-to-r from-blue-600 to-pink-500 px-4 py-1.5 font-mono text-xl font-bold tracking-[0.3em] text-white sm:text-2xl">
                              {VSCODE_PASSWORD}
                            </p>
                          </div>
                          <p className="leading-relaxed text-gray-600">
                            Abrí{" "}
                            <span className="font-semibold text-gray-800">
                              Visual Studio Code
                            </span>{" "}
                            en el escritorio y usala para desbloquearlo.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ScreenWindow>
            ) : null}

            {/* Ventana: Google Chrome → historial con 2 páginas visitadas */}
            {openWindow === "chrome" ? (
              <ScreenWindow
                title={
                  historyView
                    ? `${HISTORY_ENTRIES.find((h) => h.id === historyView)?.title} — Google Chrome`
                    : "Historial — Google Chrome"
                }
                onClose={closeWindow}
              >
                {!historyView ? (
                  <div className="flex flex-col">
                    <div className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-gray-500">
                      🔍 Buscar en el historial
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {HISTORY_ENTRIES.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => setHistoryView(h.id)}
                            className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left transition-colors hover:bg-gray-50"
                          >
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${h.color}`}
                              aria-hidden="true"
                            >
                              🌐
                            </span>
                            <span className="flex-1 text-blue-700 underline">
                              {h.title}
                            </span>
                            <span className="shrink-0 text-gray-400">{h.time}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setHistoryView(null)}
                      className="mb-0.5 self-start font-semibold text-blue-700 underline"
                    >
                      ← Volver al historial
                    </button>
                    {historyView === "delete" ? (
                      <>
                        <p className="font-bold text-gray-800">
                          Cómo eliminar un archivo (y cómo recuperarlo)
                        </p>
                        <p className="leading-relaxed text-gray-700">
                          Cuando borrás un archivo, en realidad no desaparece:
                          se manda a la Papelera de reciclaje. Ahí se queda
                          guardado hasta que alguien lo restaura o vacía la
                          papelera.
                        </p>
                        <p className="leading-relaxed text-gray-700">
                          Si necesitás recuperar algo que se borró por error,
                          lo único que hay que hacer es abrir la Papelera,
                          buscar el archivo en la lista, seleccionarlo y elegir
                          la opción Restaurar.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-800">
                          Cómo solucionar el error de ADDE Labs
                        </p>
                        <p className="leading-relaxed text-gray-700">
                          La página de ADDE Labs se cayó porque le faltan las
                          instrucciones para ordenar una lista de números.
                          Esas instrucciones están en un archivo que se borró
                          sin querer.
                        </p>
                        <p className="leading-relaxed text-gray-700">
                          Para ordenar cualquier lista alcanza con comparar
                          los números de a pares, uno al lado del otro, y
                          cambiarlos de lugar si están al revés. Después se
                          sigue con el próximo par, y así hasta el final.
                        </p>
                        <p className="leading-relaxed text-gray-700">
                          Como algunos números quedan mal ubicados la primera
                          vez, hay que repetir todo el proceso varias veces.
                        </p>
                        <p className="leading-relaxed text-gray-700">
                          Lo único que nunca cambia es el principio: siempre
                          se arranca con la lista tal como llegó, sin tocar
                          nada todavía. Y se termina recién cuando, después de
                          revisar todo, ya no hace falta cambiar nada más: ahí
                          se guarda el resultado.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </ScreenWindow>
            ) : null}

            {/* Ventana: VS Code → el código real que hay que "activar" */}
            {openWindow === "vscode" ? (
              <ScreenWindow
                title={
                  vscodeUnlocked
                    ? "recuperar_ia.js - Visual Studio Code"
                    : "Visual Studio Code — Bloqueado"
                }
                onClose={closeWindow}
              >
                {!vscodeUnlocked ? (
                  <div className="flex flex-col items-center gap-3 bg-[#1e1e1e] px-6 py-10 text-center text-[#d4d4d4]">
                    <p className="text-4xl" aria-hidden="true">
                      🔒
                    </p>
                    <p className="text-xl font-bold text-white">
                      Aplicación bloqueada
                    </p>
                    <p className="max-w-sm leading-relaxed text-gray-400">
                      La IA corrupta bloqueó Visual Studio Code antes de que
                      la restauraran. Ingresá la contraseña para
                      desbloquearlo.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (passwordInput.trim().toUpperCase() === VSCODE_PASSWORD) {
                          setVscodeUnlocked(true)
                          setPasswordError(false)
                        } else {
                          setPasswordError(true)
                        }
                      }}
                      className="flex flex-wrap items-center justify-center gap-2"
                    >
                      <input
                        type="text"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value)
                          setPasswordError(false)
                        }}
                        placeholder="Contraseña"
                        className="w-40 rounded-md border-2 border-gray-600 bg-[#2d2d2d] px-3 py-2 text-center font-mono text-lg tracking-widest text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Desbloquear
                      </button>
                    </form>
                    {passwordError ? (
                      <p className="font-semibold text-red-400">
                        Contraseña incorrecta.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <>
                <div className="flex bg-[#1e1e1e] text-[#d4d4d4]">
                  {/* Barra de actividad */}
                  <div className="flex w-9 shrink-0 flex-col items-center gap-4 bg-[#333333] py-3 text-base text-gray-400 sm:w-10">
                    <span aria-hidden="true">📄</span>
                    <span aria-hidden="true">🔍</span>
                    <span aria-hidden="true">⎇</span>
                  </div>
                  {/* Explorador */}
                  <div className="hidden w-32 shrink-0 flex-col bg-[#252526] px-2 py-3 sm:flex">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Explorador
                    </p>
                    <p className="rounded bg-[#37373d] px-2 py-1 text-sm text-gray-100">
                      📄 recuperar_ia.js
                    </p>
                  </div>
                  {/* Editor */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex shrink-0 items-center gap-1.5 border-b border-[#1e1e1e] bg-[#2d2d2d] px-3 py-1.5 text-sm">
                      <span aria-hidden="true">📄</span>
                      <span>recuperar_ia.js</span>
                    </div>
                    <div className="flex-1 overflow-x-auto px-3 py-3 font-mono text-sm sm:text-base">
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
                        iaRecuperada = {" "}
                        <button
                          type="button"
                          onClick={() => setIaRecuperada((v) => !v)}
                          className={`rounded px-1 font-bold underline decoration-dashed underline-offset-4 ${
                            iaRecuperada ? "text-[#4ec9b0]" : "text-[#569cd6]"
                          }`}
                        >
                          {iaRecuperada ? "true" : "false"}
                        </button>
                        ;
                      </CodeLine>
                      <CodeLine n={5}>&nbsp;</CodeLine>
                      <CodeLine n={6}>
                        <span className="text-[#569cd6]">function</span>{" "}
                        <span className="text-[#dcdcaa]">liberarFragmento</span>
                        () {"{"}
                      </CodeLine>
                      <CodeLine n={7}>
                        {"  "}
                        <span className="text-[#569cd6]">if</span> (
                        !iaRecuperada) {"{"}
                      </CodeLine>
                      <CodeLine n={8}>
                        {"    "}
                        <span className="text-[#569cd6]">return</span>{" "}
                        <span className="text-[#ce9178]">
                          "Esperando recuperación..."
                        </span>
                        ;
                      </CodeLine>
                      <CodeLine n={9}>{"  }"}</CodeLine>
                      <CodeLine n={10}>
                        {"  "}
                        <span className="text-[#569cd6]">return</span>{" "}
                        <span className="text-[#ce9178]">
                          "Fragmento liberado: H4CK3D"
                        </span>
                        ;
                      </CodeLine>
                      <CodeLine n={11}>{"}"}</CodeLine>
                      <CodeLine n={12}>&nbsp;</CodeLine>
                      <CodeLine n={13}>
                        <span className="text-[#dcdcaa]">console</span>.
                        <span className="text-[#dcdcaa]">log</span>(
                        liberarFragmento());
                      </CodeLine>
                    </div>
                    {/* Terminal */}
                    <div className="shrink-0 border-t border-[#1e1e1e] bg-[#181818] px-3 py-2 font-mono text-sm">
                      <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                        Terminal
                      </p>
                      <p className="text-gray-400">&gt; node recuperar_ia.js</p>
                      <p
                        className={
                          iaRecuperada
                            ? "font-bold text-[#4ec9b0]"
                            : "text-gray-500"
                        }
                      >
                        {iaRecuperada
                          ? "Fragmento liberado: H4CK3D"
                          : "Esperando recuperación..."}
                      </p>
                    </div>
                  </div>
                </div>

                {iaRecuperada ? (
                  <div className="flex flex-col items-center gap-2 border-t border-gray-200 bg-white px-4 py-4 text-center">
                    <p className="font-semibold text-blue-800">
                      Código del fragmento
                    </p>
                    <p className="rounded-md bg-gradient-to-r from-blue-600 to-pink-500 px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] text-white sm:text-3xl">
                      {FRAGMENT_CODE}
                    </p>
                    <p className="text-gray-600">
                      Anotá este código, lo van a necesitar más adelante.
                    </p>
                    <Link
                      href="/plano"
                      className="mt-1 rounded-md bg-green-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      Volver al plano
                    </Link>
                  </div>
                ) : null}
                  </>
                )}
              </ScreenWindow>
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
