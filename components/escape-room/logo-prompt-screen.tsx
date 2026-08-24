"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check, Copy, Plus, Sparkles, Wand2, X } from "lucide-react"
import { CyberFrame } from "./cyber-frame"
import { LAB_COLORS } from "./floor-plan"

/** Color de acento de cada paso: los cinco ámbitos del juego, en el mismo
 *  orden que "ADDE LABS" de la bienvenida, y rosa para el paso 06 (el mismo
 *  del cartel "paso previo"). */
const PASO_COLORS = [
  LAB_COLORS.AMI, // 01 amarillo
  LAB_COLORS.HMP, // 02 violeta
  LAB_COLORS.CEO, // 03 blanco
  LAB_COLORS.LUM, // 04 rojo
  LAB_COLORS.CIDI, // 05 verde
  "var(--neon-pink)", // 06 rosa
]

/* -------------------------------------------------------------------------
 * PASO PREVIO AL REGISTRO — Taller de identidad del equipo
 * Antes de cargar nombre y foto, el equipo responde las preguntas de la guía
 * (personalidad, temática, colores, símbolos, estilo gráfico) y la pantalla
 * arma en vivo el prompt que van a usar en otra IA para generar su logo.
 *
 * Todas las preguntas aceptan texto libre además de los globitos sugeridos:
 * lo que escriben se suma como un globito más, borrable con la X.
 *
 * El layout está pensado para entrar en una pantalla sin scroll (grilla de
 * tres columnas, tipografía compacta). En pantallas chicas el bloque scrollea
 * hacia adentro en vez de estirar la página.
 * ---------------------------------------------------------------------- */

const PERSONALIDADES = [
  "misteriosos",
  "divertidos",
  "competitivos",
  "inteligentes",
  "aventureros",
  "valientes",
  "creativos",
]

const TEMATICAS = [
  "detectivesco",
  "tecnológico",
  "antiguo",
  "futurista",
  "fantástico",
  "espacial",
]

/** Las paletas sugeridas se expanden a colores concretos dentro del prompt.
 *  Una paleta escrita a mano se usa tal cual la escribieron. */
const PALETAS: { label: string; prompt: string }[] = [
  { label: "oscuros y misteriosos", prompt: "oscuros y misteriosos, como negro y azul profundo" },
  { label: "brillantes y llamativos", prompt: "brillantes y llamativos, como naranja, amarillo y turquesa" },
  { label: "neutros y elegantes", prompt: "neutros y elegantes, como gris, blanco y dorado" },
  { label: "neón cyberpunk", prompt: "neón cyberpunk, como verde lima, cyan y violeta" },
]

const SIMBOLOS = [
  "una lupa",
  "un candado",
  "una calavera",
  "engranajes",
  "llaves",
  "un reloj de arena",
  "un circuito",
  "un rayo",
]

const ESTILOS = [
  "minimalista",
  "realista",
  "vintage",
  "futurista",
  "caricaturesco",
]

const EJEMPLOS = [
  "Un logo para el equipo Los Enigmas, con un estilo misterioso y detectivesco. Debe incluir una lupa y un candado, usando colores oscuros como negro y azul. Estilo minimalista, como un logo moderno.",
  "Un logo para el grupo Llave Maestra, divertido y colorido. Incluir una gran llave dorada y engranajes, en un estilo caricaturesco.",
  "Un logo para Cronos, nuestro equipo, con un estilo elegante y futurista. Queremos un reloj de arena metálico, en tonos plateados y morados.",
]

/** Une una lista en lenguaje natural: "a, b y c". */
function unirEnEspanol(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`
}

export type LogoBriefing = {
  teamName: string
  prompt: string
}

/* ------------------------------ Piezas de UI ------------------------------ */

/** Bloque numerado con el mismo aire de "ficha de expediente" del resto. */
function Paso({
  numero,
  titulo,
  ayuda,
  color,
  children,
}: {
  numero: number
  titulo: string
  ayuda: string
  color: string
  children: React.ReactNode
}) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-[var(--neon-cyan)]/25 bg-[oklch(0.18_0.04_264/0.78)] p-4 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon-cyan)_10%,transparent)] backdrop-blur-sm">
      <div className="flex items-baseline gap-2">
        <span
          className="font-pixel text-[0.7rem] leading-none"
          style={{ color, textShadow: `0 0 12px color-mix(in oklch, ${color} 60%, transparent)` }}
        >
          0{numero}
        </span>
        <h3 className="font-pixel text-[0.62rem] uppercase leading-relaxed text-foreground sm:text-[0.7rem]">
          {titulo}
        </h3>
      </div>
      <p className="mt-1.5 font-mono text-xs leading-snug text-muted-foreground">{ayuda}</p>
      {/* flex-1 + centrado: cuando la fila de la grilla se estira para llenar
          la pantalla, los globitos quedan centrados en vez de pegados arriba. */}
      <div className="mt-3 flex flex-1 items-center">{children}</div>
    </section>
  )
}

/**
 * Globitos elegibles + campo para escribir los propios. Lo que se escribe se
 * agrega a la selección como un globito más (con X para sacarlo), así la
 * respuesta nunca queda limitada a la lista sugerida.
 */
function ChipGroup({
  options,
  value,
  onChange,
  color,
  multi = false,
  placeholder,
}: {
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
  color: string
  /** true: se pueden elegir varias. false: elegir una reemplaza la anterior. */
  multi?: boolean
  placeholder: string
}) {
  const [draft, setDraft] = useState("")
  const propios = value.filter((v) => !options.includes(v))

  function toggle(opcion: string) {
    if (value.includes(opcion)) {
      onChange(value.filter((v) => v !== opcion))
      return
    }
    onChange(multi ? [...value, opcion] : [opcion])
  }

  function agregarPropio() {
    const texto = draft.trim()
    if (!texto) return
    if (!value.some((v) => v.toLowerCase() === texto.toLowerCase())) {
      onChange(multi ? [...value, texto] : [texto])
    }
    setDraft("")
  }

  const chipBase =
    "rounded-full border px-3 py-1.5 font-mono text-xs leading-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background"

  function chipStyle(selected: boolean) {
    return {
      borderColor: selected ? color : "color-mix(in oklch, var(--neon-cyan) 25%, transparent)",
      backgroundColor: selected ? `color-mix(in oklch, ${color} 20%, transparent)` : "transparent",
      color: selected ? color : "var(--muted-foreground)",
      boxShadow: selected ? `0 0 12px color-mix(in oklch, ${color} 32%, transparent)` : "none",
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {options.map((opcion) => (
        <button
          key={opcion}
          type="button"
          onClick={() => toggle(opcion)}
          aria-pressed={value.includes(opcion)}
          className={chipBase}
          style={chipStyle(value.includes(opcion))}
        >
          {opcion}
        </button>
      ))}

      {/* Respuestas escritas por el equipo */}
      {propios.map((propio) => (
        <span
          key={propio}
          className={`${chipBase} inline-flex items-center gap-1`}
          style={chipStyle(true)}
        >
          {propio}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== propio))}
            aria-label={`Quitar ${propio}`}
            className="rounded-full transition-opacity hover:opacity-70 focus:outline-none"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}

      {/* Campo para escribir la respuesta propia */}
      <span
        className="inline-flex min-w-[8.5rem] flex-1 items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 transition-colors focus-within:border-solid"
        style={{ borderColor: `color-mix(in oklch, ${color} 45%, transparent)` }}
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              agregarPropio()
            }
          }}
          onBlur={agregarPropio}
          placeholder={placeholder}
          maxLength={60}
          className="w-full min-w-0 bg-transparent font-mono text-xs leading-none text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={agregarPropio}
          aria-label="Agregar lo que escribiste"
          className="shrink-0 transition-opacity hover:opacity-70 focus:outline-none"
          style={{ color }}
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </span>
    </div>
  )
}

/* ------------------------------- Pantalla -------------------------------- */

export function LogoPromptScreen({
  onContinue,
}: {
  onContinue: (briefing: LogoBriefing) => void
}) {
  const [teamName, setTeamName] = useState("")
  const [personalidades, setPersonalidades] = useState<string[]>([])
  const [tematica, setTematica] = useState<string[]>([])
  const [paleta, setPaleta] = useState<string[]>([])
  const [simbolos, setSimbolos] = useState<string[]>([])
  const [estilo, setEstilo] = useState<string[]>([])
  const [copiado, setCopiado] = useState(false)
  const [verEjemplos, setVerEjemplos] = useState(false)

  const prompt = useMemo(() => {
    const nombre = teamName.trim() || "nuestro equipo"
    const partes: string[] = [`Un logo para el equipo ${nombre}`]

    if (personalidades.length > 0) {
      partes.push(`que transmita que somos ${unirEnEspanol(personalidades)}`)
    }
    if (tematica.length > 0) partes.push(`con una estética ${unirEnEspanol(tematica)}`)

    let texto = `${partes.join(", ")}.`

    if (simbolos.length > 0) {
      texto += ` El diseño debe incluir ${unirEnEspanol(simbolos)}.`
    }
    if (paleta.length > 0) {
      const sugerida = PALETAS.find((p) => p.label === paleta[0])
      texto += ` Usar una paleta de colores ${sugerida ? sugerida.prompt : paleta[0]}.`
    }
    if (estilo.length > 0) texto += ` Estilo ${unirEnEspanol(estilo)}.`

    texto += " Debe ser claro y reconocible, como un logo profesional."
    return texto
  }, [teamName, personalidades, tematica, paleta, simbolos, estilo])

  // Pedimos lo mínimo para que el prompt no salga vacío: nombre + al menos
  // una decisión de identidad. El resto lo ajustan probando con la IA.
  const listo =
    teamName.trim().length > 0 &&
    personalidades.length + simbolos.length + tematica.length > 0

  async function copiar() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  function continuar() {
    if (!listo) return
    const briefing = { teamName: teamName.trim(), prompt }
    sessionStorage.setItem("escape-room-logo-briefing", JSON.stringify(briefing))
    onContinue(briefing)
  }

  return (
    <CyberFrame fullWidth fitViewport contentClassName="max-w-6xl">
      {/* Columna a pantalla completa: encabezado y pie fijos, y la grilla de
          preguntas creciendo para repartir el espacio sobrante. */}
      <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto py-2 sm:gap-6">
        {/* Encabezado */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--neon-pink)]/60 bg-[oklch(0.16_0.04_264/0.55)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[var(--neon-pink)] shadow-[0_0_24px_color-mix(in_oklch,var(--neon-pink)_20%,transparent)]">
            <Sparkles className="size-4" aria-hidden="true" />
            paso previo
          </div>
          <h2 className="font-pixel text-lg leading-[1.4] neon-cyan text-balance sm:text-2xl">
            EL LOGO DE TU EQUIPO
          </h2>
        </div>
        <p className="mx-auto -mt-2 max-w-3xl shrink-0 text-center font-mono text-xs leading-relaxed text-muted-foreground sm:-mt-4 sm:text-sm">
          Definan quiénes son y el sistema arma el{" "}
          <span className="text-[var(--neon-green)]">prompt</span> que van a usar en otra
          inteligencia artificial para generar el logo. Elijan globitos{" "}
          <span className="text-[var(--neon-cyan)]">o escriban lo suyo</span> en cualquier
          pregunta. El logo no solo tiene que verse bien: tiene que contar quiénes son.
        </p>

        {/* Cuestionario: flex-1 para que las filas se estiren y ocupen todo el
            alto libre en vez de amontonarse arriba. */}
        <div className="grid w-full flex-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <Paso
            numero={1}
            titulo="Nombre del equipo"
            ayuda="¿Cómo se llama nuestro grupo?"
            color={PASO_COLORS[0]}
          >
            <input
              id="logo-team-name"
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Ej: Los Enigmas"
              maxLength={40}
              className="w-full rounded-md border-2 border-[var(--neon-cyan)]/40 bg-[oklch(0.16_0.04_264/0.7)] px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--neon-cyan)]"
            />
          </Paso>

          <Paso
            numero={2}
            titulo="Personalidad"
            ayuda="¿Somos misteriosos, divertidos, competitivos…? Pueden elegir varias."
            color={PASO_COLORS[1]}
          >
            <ChipGroup
              options={PERSONALIDADES}
              value={personalidades}
              onChange={setPersonalidades}
              color={PASO_COLORS[1]}
              multi
              placeholder="escribí otra…"
            />
          </Paso>

          <Paso
            numero={3}
            titulo="Temática"
            ayuda="¿Qué mundo queremos evocar con el logo?"
            color={PASO_COLORS[2]}
          >
            <ChipGroup
              options={TEMATICAS}
              value={tematica}
              onChange={setTematica}
              color={PASO_COLORS[2]}
              placeholder="escribí otra…"
            />
          </Paso>

          <Paso
            numero={4}
            titulo="Colores"
            ayuda="¿Qué paleta nos representa mejor?"
            color={PASO_COLORS[3]}
          >
            <ChipGroup
              options={PALETAS.map((p) => p.label)}
              value={paleta}
              onChange={setPaleta}
              color={PASO_COLORS[3]}
              placeholder="ej: verde y dorado"
            />
          </Paso>

          <Paso
            numero={5}
            titulo="Símbolos"
            ayuda="¿Qué elementos queremos que aparezcan? Pueden elegir varios."
            color={PASO_COLORS[4]}
          >
            <ChipGroup
              options={SIMBOLOS}
              value={simbolos}
              onChange={setSimbolos}
              color={PASO_COLORS[4]}
              multi
              placeholder="ej: un dragón"
            />
          </Paso>

          <Paso
            numero={6}
            titulo="Estilo gráfico"
            ayuda="¿Cómo queremos que esté dibujado? Pueden sumar el detalle que quieran."
            color={PASO_COLORS[5]}
          >
            <ChipGroup
              options={ESTILOS}
              value={estilo}
              onChange={setEstilo}
              color={PASO_COLORS[5]}
              multi
              placeholder="escribí otro…"
            />
          </Paso>
        </div>

        {/* Prompt generado */}
        <div className="w-full shrink-0 rounded-xl border-2 border-[var(--neon-green)]/55 bg-[oklch(0.1_0.04_264/0.85)] p-4 shadow-[0_0_30px_color-mix(in_oklch,var(--neon-green)_22%,transparent)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-pixel text-[0.62rem] uppercase leading-relaxed text-[var(--neon-green)]">
              <Wand2 className="size-4" aria-hidden="true" />
              tu prompt
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVerEjemplos((v) => !v)}
                aria-expanded={verEjemplos}
                className="font-mono text-xs text-[var(--neon-cyan)] underline-offset-4 hover:underline focus:outline-none"
              >
                {verEjemplos ? "▾ ocultar ejemplos" : "▸ ver ejemplos"}
              </button>
              <button
                type="button"
                onClick={copiar}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--neon-green)]/60 px-3 py-1.5 font-mono text-xs text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)] hover:text-background focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-green)]"
              >
                {copiado ? (
                  <>
                    <Check className="size-3.5" aria-hidden="true" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden="true" /> Copiar
                  </>
                )}
              </button>
            </div>
          </div>
          <p aria-live="polite" className="mt-2.5 font-mono text-sm leading-relaxed text-foreground">
            <span className="text-[var(--neon-green)]">&gt; </span>
            {prompt}
            <span className="blink ml-0.5 text-[var(--neon-green)]">_</span>
          </p>
          {verEjemplos && (
            <ul className="mt-3 space-y-2 border-t border-[var(--neon-green)]/20 pt-3">
              {EJEMPLOS.map((e) => (
                <li key={e} className="font-mono text-xs leading-snug text-muted-foreground">
                  “{e}”
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Consejo + continuar */}
        <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-3 pb-1">
          {/* pl-*: deja libre la esquina inferior izquierda, donde el layout
              raíz fija la insignia de INFO ORT. */}
          <p className="max-w-xl pl-16 font-mono text-xs leading-relaxed text-muted-foreground sm:pl-20">
            <span className="text-[var(--neon-pink)]">Ajustá y probá:</span> la primera
            imagen puede no ser perfecta. Agreguen detalles, saquen lo que no les guste y
            piensen en lo que quieren transmitir como equipo.
          </p>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={continuar}
              disabled={!listo}
              className="rounded-md border-2 border-[var(--neon-green)] bg-[var(--neon-green)] px-7 py-4 font-pixel text-sm text-background transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-muted disabled:bg-transparent disabled:text-muted-foreground sm:text-base"
            >
              <span className="inline-flex items-center gap-3">
                IR AL REGISTRO
                <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
              </span>
            </button>
            {!listo && (
              <p className="font-mono text-xs text-muted-foreground">
                Falta el nombre y al menos una característica.
              </p>
            )}
          </div>
        </div>
      </div>
    </CyberFrame>
  )
}
