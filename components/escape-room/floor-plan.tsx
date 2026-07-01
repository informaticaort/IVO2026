type Room = {
  x: number
  y: number
  w: number
  h: number
  label?: string
  subtitle?: string
  href?: string
  ariaLabel?: string
  /** "key" = laboratorio importante, "minor" = sala etiquetada secundaria */
  tone?: "key" | "minor"
  /** Color de acento (borde/relleno/glow) para laboratorios clave. */
  color?: string
  vertical?: boolean
}

/** Color de acento por laboratorio clave (compartido con la leyenda). */
export const LAB_COLORS: Record<string, string> = {
  AMI: "oklch(0.9 0.19 100)", // amarillo
  HMP: "oklch(0.62 0.25 300)", // violeta
  CEO: "oklch(0.98 0.01 240)", // blanco
  LUM: "var(--neon-red)", // rojo
  CIDI: "var(--neon-green)", // verde
}

const PLAN_SCALE = 2.2
const PLAN_WIDTH = 850
const PLAN_HEIGHT = 795
const VIEWBOX_PADDING = 24

function scaleRoom(room: Room): Room {
  return {
    ...room,
    x: room.x * PLAN_SCALE,
    y: room.y * PLAN_SCALE,
    w: room.w * PLAN_SCALE,
    h: room.h * PLAN_SCALE,
  }
}

/** Salas comunes del piso (sin resaltar) */
const PLAIN_ROOMS: Room[] = [
  /** SALA DE PROFES DE INGLÉS */
  {x: 0, y:742, w: 50, h: 50},
  {x: 0, y:692, w: 50, h: 50},
  {x: 0, y:642, w: 50, h: 50},
  {x: 0, y:592, w: 50, h: 50},
  {x: 50, y:592, w: 250, h: 200},

  /** BAÑOS */
  {x: 200, y:442, w: 100, h: 50},
  {x: 550, y:568, w: 100, h: 50},
  {x: 550, y:518, w: 100, h: 50},

  /** AULAS PRIMER PISO */
  {x: 300, y:368, w: 100, h: 125},
  {x: 300, y:242, w: 100, h: 125},
  {x: 300, y:142, w: 125, h: 100},
  {x: 425, y:142, w: 125, h: 100},
  {x: 450, y:242, w: 100, h: 125},
  {x: 650, y:670, w: 100, h: 120},
  {x: 550, y:142, w: 100, h: 378},

  {x: 750, y:515, w: 100, h: 125},
  {x: 750, y:390, w: 100, h: 125},
  {x: 750, y:265, w: 100, h: 125},

  {x: 730, y:142, w: 120, h: 123},

  /** DIRECCIÓN Y COORDINACIÓN*/
  {x: 300, y:670, w: 150, h: 100},
  {x: 450, y:670, w: 100, h: 100},
  {x: 550, y:670, w: 100, h: 100},

  {x: 650, y:192, w: 80, h: 50},
]

/** Puertas / accesos bloqueados */
const DOORS: Room[] = [
  
]

/** Salas etiquetadas: laboratorios importantes y oficinas secundarias */
const LABELED_ROOMS: Room[] = [
  /** LABORATORIOS IMPORTANTES */
  {
    x: 0,
    y: 142,
    w: 100,
    h: 150,
    label: "AMI",
    tone: "key",
    color: LAB_COLORS.AMI,
    href: "/ami-game",
    ariaLabel: "Abrir juego de AMI",
  },
  {
    x: 100,
    y: 142,
    w: 100,
    h: 150,
    label: "HMP",
    tone: "key",
    color: LAB_COLORS.HMP,
    href: "/hmp-game",
    ariaLabel: "Abrir juego de HMP",
  },
  {
    x: 0,
    y: 292,
    w: 200,
    h: 200,
    label: "CIDI",
    tone: "key",
    color: LAB_COLORS.CIDI,
    href: "/cidi-game",
    ariaLabel: "Abrir juego de CIDI",
  },
  {
    x: 450,
    y: 368,
    w: 100,
    h: 250,
    label: "CEO",
    tone: "key",
    color: LAB_COLORS.CEO,
    href: "/ceo-game",
    ariaLabel: "Abrir juego de CEO",
  },
  {
    x: 750,
    y: 640,
    w: 100,
    h: 150,
    label: "LUM",
    tone: "key",
    color: LAB_COLORS.LUM,
    href: "/lum-game",
    ariaLabel: "Abrir juego de LUM",
  },

  /** OFICINAS SECUNDARIAS */
  { x: 0, y: 492, w: 50, h: 100, label: "Dami", tone: "minor" },
  { x: 50, y: 492, w: 50, h: 100, label: "Profes info", tone: "minor" },
  { x: 100, y: 492, w: 100, h: 100, label: "MEP", tone: "minor" },
]

function PlainRoom({ x, y, w, h }: Room) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill="oklch(0.2 0.045 264 / 0.55)"
      stroke="var(--neon-cyan)"
      strokeOpacity={0.45}
      strokeWidth={2.5}
    />
  )
}

function LabeledRoom({ room }: { room: Room }) {
  const isKey = room.tone === "key"
  const cx = room.x + room.w / 2
  const cy = room.y + room.h / 2
  const accent = room.color ?? (isKey ? "var(--neon-green)" : "var(--neon-cyan)")
  const stroke = accent
  const fill = isKey
    ? `color-mix(in oklch, ${accent} 16%, transparent)`
    : `color-mix(in oklch, ${accent} 12%, transparent)`

  // Las salas clave usan la fuente pixelada grande; las secundarias usan
  // mono pequeña y, si el nombre es largo, lo repartimos en varias líneas.
  const lines = isKey ? [room.label ?? ""] : (room.label ?? "").split(" ")
  const lineHeight = isKey ? 0 : 11 * PLAN_SCALE
  const startY = cy - ((lines.length - 1) * lineHeight) / 2

  const content = (
    <g
      style={
        isKey
          ? { filter: `drop-shadow(0 0 6px color-mix(in oklch, ${accent} 65%, transparent))` }
          : undefined
      }
    >
      <rect
        x={room.x}
        y={room.y}
        width={room.w}
        height={room.h}
        fill={fill}
        stroke={stroke}
        strokeWidth={isKey ? 4 : 3}
      />
      <text
        x={cx}
        y={room.subtitle ? cy - 6 : startY}
        textAnchor="middle"
        dominantBaseline="central"
        transform={room.vertical ? `rotate(-90 ${cx} ${cy})` : undefined}
        className={isKey ? "font-pixel" : "font-mono"}
        fill={stroke}
        fontWeight={isKey ? undefined : 600}
        fontSize={isKey ? 26 * PLAN_SCALE : 10 * PLAN_SCALE}
      >
        {isKey
          ? room.label
          : lines.map((word, i) => (
              <tspan key={i} x={cx} dy={i === 0 ? 0 : lineHeight}>
                {word}
              </tspan>
            ))}
      </text>
      {room.subtitle ? (
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono"
          fill={stroke}
          fillOpacity={0.85}
          fontSize={8 * PLAN_SCALE}
        >
          {room.subtitle}
        </text>
      ) : null}
    </g>
  )

  if (room.href) {
    return (
      <a
        href={room.href}
        aria-label={room.ariaLabel ?? room.label}
        className="cursor-pointer"
      >
        {content}
      </a>
    )
  }

  return content
}

const SCALED_PLAIN_ROOMS = PLAIN_ROOMS.map(scaleRoom)
const SCALED_LABELED_ROOMS = LABELED_ROOMS.map(scaleRoom)
const SCALED_DOORS = DOORS.map(scaleRoom)

export function FloorPlan() {
  return (
    <svg
      viewBox={`-${VIEWBOX_PADDING} -${VIEWBOX_PADDING} ${PLAN_WIDTH * PLAN_SCALE + VIEWBOX_PADDING * 2} ${PLAN_HEIGHT * PLAN_SCALE + VIEWBOX_PADDING * 2}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Plano del piso de laboratorios. Laboratorios destacados: CIDI, AMI, HMP, CEO y LUM."
      className="block h-full w-full max-w-none"
    >
      {SCALED_PLAIN_ROOMS.map((room, i) => (
        <PlainRoom key={`plain-${i}`} {...room} />
      ))}

      {SCALED_LABELED_ROOMS.map((room, i) => (
        <LabeledRoom key={`labeled-${i}`} room={room} />
      ))}

      {SCALED_DOORS.map((door, i) => (
        <rect
          key={`door-${i}`}
          x={door.x}
          y={door.y}
          width={door.w}
          height={door.h}
          fill="var(--neon-red)"
          fillOpacity={0.85}
        />
      ))}
    </svg>
  )
}
