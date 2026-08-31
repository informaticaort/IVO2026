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
  password: "UX",
  completedSpeech:
    "La interfaz volvió a coincidir con el sistema original y el pendrive recuperó el fragmento de LUM. De hecho, quedó impecable. Podés revisar el registro de la entrevista si querés.",
  questions: [
    {
      id: "q1",
      question: "Santi, ¿qué hacías a las 03:00 AM?",
      answer:
        "Dormía. De hecho, no solo dormía: estaba en fase de sueño profundo, según mi reloj inteligente.\n\n" +
        "Me dormí a las 23:42. Frecuencia cardíaca estable, respiración normal y cero actividad registrada hasta que sonó la alerta general.\n\n" +
        "Así que sí. Estaba durmiendo. ¿Podemos pasar a algo más útil?",
    },
    {
      id: "q2",
      question: "¿Qué pasó exactamente en LUM?",
      answer:
        "La IA alteró las pantallas principales. Cambió patrones visuales, desordenó elementos y escondió pistas dentro de errores de diseño.\n\n" +
        "Para recuperar el fragmento de código de LUM tienen que resolver el desafío visual.\nObservar diferencias, detectar patrones y reconstruir la interfaz correcta. De hecho, no es difícil. Bueno… No debería ser difícil.\n\n" +
        "El problema es que alguien alteró deliberadamente la lógica que yo había diseñado.\nY de hecho, eso me molesta. Y mucho.",
    },
    {
      id: "q3",
      question: "¿Quién creés que pudo usar la credencial de Avril?",
      answer:
        "Cualquiera con acceso físico a su escritorio.\n\n" +
        "Avril siempre llega tarde, siempre deja cosas tiradas y siempre dice “después lo ordeno”.\nDe hecho, su credencial estuvo varias veces arriba de la mesa de reuniones.\n\n" +
        "Hay demasiadas cosas que coinciden.\nY cuando demasiadas cosas coinciden, normalmente alguien está intentando que parezcan una coincidencia.",
    },
    {
      id: "q4",
      question: "¿Qué pista nos podés dar?",
      answer:
        "El código corrupto tiene una estructura demasiado ordenada. Eso es lo que me molesta.\n\n" +
        "Si alguien quisiera destruir el sistema, podría haberlo hecho de cualquier manera. Pero no. Lo hizo siguiendo una lógica. Una lógica que yo debería haber detectado y que, de hecho, no detecté.\n\n" +
        "Eso significa que alguien logró estar un paso adelante mío. No me gusta, para nada.\n\n" +
        "Así que no estoy buscando solamente al saboteador. Estoy intentando descubrir quién fue capaz de engañarme. Porque si alguien consiguió hacer eso… Quiero saber quién.",
      // PISTA 10/10: cierra con Avril — código "muy ordenado pero con soberbia".
      highlights: ["El código corrupto tiene una estructura demasiado ordenada"],
    },
  ],
}

export function LumConversation() {
  return (
    <LabConversation
      config={LUM_CONFIG}
      renderGame={({ exit, complete }) => (
        <LumDesignGame onExit={exit} onWin={complete} />
      )}
    />
  )
}
