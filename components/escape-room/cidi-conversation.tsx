"use client"

import { LabConversation, type LabConversationConfig } from "./lab-conversation"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO CIDI — Sospechosa: BELEN (Líder del proyecto)
 * ---------------------------------------------------------------------- */
const CIDI_CONFIG: LabConversationConfig = {
  acronym: "CIDI",
  speaker: "Belen",
  greeting:
    "¡Perdón la demora! No me sonó el despertador. ¿Qué es todo este caos? ¿Por qué están las alarmas en rojo?",
  closingSpeech:
    "¡No hay tiempo que perder! Consigan los 4 fragmentos, ingrésenlos en el orden correcto de la estructura del sistema y entramos al CIDI. ¡Apúrense!",
  questions: [
    {
      id: "q1",
      question:
        "Belén, sos la última en aparecer. El resto del equipo está acá desde las 03:00 AM. ¿Dónde estabas?",
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
        "El código corrupto la volvió paranoica. Bloqueó los accesos generales y empezó a encriptar todo para “defenderse”. El tiempo corre: si no la desinfectamos en los minutos que quedan, el sistema ejecutará la auto-destrucción total.",
    },
    {
      id: "q4",
      question:
        "Leo nos contó que tuvieron una discusión durísima antes del colapso. ¿Por qué nos lo ocultaste?",
      answer:
        "No se los oculté, ¡recién llego! Estaba insoportable criticando la seguridad y me dijo que si algo fallaba sería mi culpa. Me dio tanto dolor de cabeza que dejé mis cosas en la mesa y me fui a tomar un café. Ahí fue cuando me sacaron la credencial.",
    },
    {
      id: "q5",
      question:
        "Ya hablamos con Santi, Valen, Mica y Leo. Con todo lo que sabés de ellos, ¿quién creés que es el responsable?",
      answer:
        "Escondió el código en las cuatro áreas, así que conoce las debilidades del sistema desde adentro y planeó esto con mucha frialdad. Cualquiera que tuviera acceso a la arquitectura y una razón para sabotearnos pudo ser. No descarten a nadie por su personalidad.",
    },
    {
      id: "q6",
      question:
        "Ya recuperamos los fragmentos de AMI, LUM, CEO y HMP en el pendrive. Estamos frente al CIDI, ¿cómo entramos?",
      answer:
        "¡Excelente, es el último paso! Como ya tienen todo listo, la terminal les va a habilitar el acceso al CIDI. Para desinfectar la IA, piensen en la lógica del saboteador: el código va a estar muy ordenado pero con soberbia. Tienen que ingresar los 4 fragmentos en el orden correcto de la estructura. ¡Háganlo ya o perdemos todo!",
    },
  ],
}

export function CidiConversation() {
  return <LabConversation config={CIDI_CONFIG} />
}
