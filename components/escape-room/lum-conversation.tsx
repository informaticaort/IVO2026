"use client"

import { LabConversation, type LabConversationConfig } from "./lab-conversation"
import { LumDesignGame } from "./lum-design-game"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO LUM — Sospechoso: SANTI (Diseño / UX)
 * ---------------------------------------------------------------------- */
const LUM_CONFIG: LabConversationConfig = {
  acronym: "LUM",
  speaker: "Santi",
  greeting:
    "Soy Santi. De hecho, prefiero los datos a las opiniones. Preguntá lo que quieras… voy a ser preciso.",
  closingSpeech:
    "Bien. El desafío visual empieza ahora. Observen diferencias, detecten patrones y reconstruyan la interfaz. De hecho, los detalles son todo.",
  questions: [
    {
      id: "q1",
      question: "Santi, ¿qué hacías a las 03:00 AM?",
      answer:
        "Dormía. De hecho, no solo dormía: estaba en fase de sueño profundo, según mi reloj inteligente. " +
        "Me dormí a las 23:42, frecuencia cardíaca estable, respiración normal y cero actividad registrada hasta que sonó la alerta general. " +
        "O sea, técnicamente podría estar mintiendo, pero mis métricas no. Y de hecho, las métricas suelen ser más confiables que las personas.",
    },
    {
      id: "q2",
      question: "¿Por qué estás en el área de Diseño si sos tan técnico?",
      answer:
        "Porque el diseño también tiene reglas. De hecho, un diseño no es “hacer algo lindo”. Es organizar información visual para que una persona la entienda. " +
        "La IA rompió grillas, colores, jerarquías, márgenes, alineaciones… un desastre. Un desastre medible, por suerte.",
    },
    {
      id: "q3",
      question: "¿Qué pasó exactamente en LUM?",
      answer:
        "La IA alteró las pantallas principales del área. Cambió patrones visuales, desordenó elementos y dejó pistas escondidas dentro de errores de diseño. " +
        "Para recuperar el fragmento de código de LUM, tienen que resolver el desafío visual. Van a tener que observar diferencias, detectar patrones y reconstruir la interfaz correcta. " +
        "De hecho, si no prestan atención a los detalles, no van a pasar.",
    },
    {
      id: "q4",
      question: "¿Quién creés que pudo usar la credencial de Alex?",
      answer:
        "Cualquiera con acceso físico a su escritorio. Alex siempre llega tarde, siempre deja cosas tiradas y siempre dice “después lo ordeno”. " +
        "De hecho, su credencial estuvo varias veces arriba de la mesa de reuniones. Lo vi. No porque estuviera espiando, sino porque observo detalles. Hay una diferencia.",
    },
    {
      id: "q5",
      question: "¿Notaste algo raro antes del sabotaje?",
      answer:
        "Sí. Belen estaba insoportable. Más de lo normal. " +
        "Cada vez que alguien corregía algo de su código, reaccionaba como si le hubieran insultado a un familiar. Decía que nadie entendía su lógica, que él ya lo había previsto, que si algo fallaba era porque los demás no sabían usarlo. " +
        "De hecho, cuando una persona cree que nunca se equivoca, es muy difícil que admita que rompió algo.",
    },
    {
      id: "q6",
      question: "¿Qué pista nos podés dar?",
      answer:
        "El código corrupto no parece hecho por alguien desordenado. Tiene una lógica bastante estructurada. " +
        "Pero también tiene algo raro: está lleno de decisiones innecesariamente arrogantes. Nombres de funciones como si el autor quisiera dejar claro que era más inteligente que todos. " +
        "Eso no prueba nada, de hecho. Pero apunta a alguien con bastante ego.",
    },
  ],
}

export function LumConversation() {
  return (
    <LabConversation
      config={LUM_CONFIG}
      renderGame={({ exit }) => <LumDesignGame onExit={exit} />}
    />
  )
}
