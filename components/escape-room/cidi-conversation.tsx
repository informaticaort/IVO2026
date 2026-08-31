"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { cidiUnlocked } from "@/lib/presence/types"
import { LabConversation, type LabConversationConfig } from "./lab-conversation"
import { CidiFinalGame } from "./cidi-final-game"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO CIDI — Sospechosa: Avril (Líder del proyecto)
 * ---------------------------------------------------------------------- */
const CIDI_CONFIG: LabConversationConfig = {
  acronym: "CIDI",
  speaker: "Avril",
  greeting:
    "¡Perdón la demora! No me sonó el despertador. ¿Qué es todo este caos? ¿Por qué están las alarmas en rojo?",
  closingSpeech:
    "¡No hay tiempo que perder! Consigan los 4 fragmentos, ingrésenlos en el orden correcto de la estructura del sistema y entramos al CIDI. ¡Apúrense!",
  // CIDI es el juego final: se puede volver al plano en todo momento y, si ya
  // se hizo la entrevista una vez, al reentrar se va directo al juego.
  exitAlwaysAvailable: true,
  resumeGameOnReturn: true,
  questions: [
    {
      id: "q1",
      question:
        "Avril, sos la última en aparecer. El resto del equipo está acá desde las 03:00 AM. ¿Dónde estabas?",
      answer:
        "¡Perdón, no me sonó el despertador! Venía de tres días sin dormir por la presión del proyecto y quedé inconsciente en mi casa. Me enteré del desastre recién al despertar por los mensajes desesperados de Valen.",
    },
    {
      id: "q2",
      question:
        "Ya revisamos los accesos y el sabotaje se ejecutó con tu credencial. ¿Qué hiciste con ella?",
      answer:
        "¡La perdí! Ayer con el caos de las entregas estuve súper desordenada. La debo haber dejado olvidada en la mesa de reuniones o en mi escritorio. Alguien aprovechó mi descuido, me la robó y me usó de chivo expiatorio.",
    },
    {
      id: "q3",
      question:
        "Los encargados de las áreas ya nos explicaron el desastre, pero como líder: ¿qué está haciendo la IA ahora mismo?",
      answer:
        "El código corrupto la volvió paranoica. Bloqueó los accesos generales y empezó a encriptar todo para “defenderse”. El tiempo corre: si no la desinfectamos en los minutos que quedan, el sistema ejecutará la autodestrucción total.",
    },
    {
      id: "q4",
      question:
        "Ya hablamos con Santi, Valen, Mica y Belén. Con todo lo que sabés de ellos, ¿quién creés que es el responsable?",
      answer:
        "Escondió el código en las cuatro áreas, así que conoce las debilidades del sistema desde adentro y planeó esto con mucha frialdad. Cualquiera que tuviera acceso a la arquitectura y una razón para sabotearnos pudo ser. No descarten a nadie por su personalidad.",
      // PISTA 5/10: el saboteador conoce el sistema desde adentro.
      highlights: ["conoce las debilidades del sistema desde adentro"],
    },
    {
      id: "q5",
      question:
        "Ya recuperamos los fragmentos de AMI, LUM, CEO y HMP en el pendrive. Estamos frente al CIDI, ¿cómo entramos?",
      answer:
        "¡Excelente, es el último paso! Como ya tienen todo listo, la terminal les va a habilitar el acceso al CIDI. Para desinfectar la IA, piensen en la lógica del saboteador: el código va a estar muy ordenado pero con soberbia. Tienen que ingresar los 4 fragmentos en el orden correcto de la estructura. ¡Háganlo ya o perdemos todo!",
      // PISTA 6/10: el retrato del saboteador — orden + soberbia.
      highlights: ["el código va a estar muy ordenado pero con soberbia"],
    },
  ],
}

export function CidiConversation() {
  const router = useRouter()
  // Guard de ruta: no se entra al CIDI hasta completar AMI, HMP, CEO y LUM.
  // Si se llega por URL directa sin cumplirlo, se vuelve al plano.
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (cidiUnlocked()) {
      setAllowed(true)
    } else {
      router.replace("/plano")
    }
  }, [router])

  if (!allowed) return null

  return (
    <LabConversation
      config={CIDI_CONFIG}
      renderGame={({ exit, complete }) => (
        <CidiFinalGame onExit={exit} onWin={complete} />
      )}
    />
  )
}
