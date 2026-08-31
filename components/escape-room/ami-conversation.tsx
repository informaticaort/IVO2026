"use client"

import { LabConversation, type LabConversationConfig } from "./lab-conversation"
import { AmiEquationsGame } from "./ami-equations-game"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO AMI — Sospechosa: MICA
 * ---------------------------------------------------------------------- */
const AMI_CONFIG: LabConversationConfig = {
  acronym: "AMI",
  speaker: "Mica",
  greeting:
    "¡Hola! ¿Cómo estás? Soy Mica.\nPreguntame lo que necesites, con tranquilidad…\nQuiero que esto se resuelva bien.",
  closingSpeech:
    "Bien. Esa computadora quedó bloqueada por la IA… resuelvan las ecuaciones con calma y conviertan cada número en su letra.",
  password: "DECRYPT",
  completedSpeech:
    "Gracias por la ayuda. Esta parte del sistema ya quedó desencriptada y el pendrive tiene su fragmento. Si querés, podés revisar el registro de lo que hablamos, pero por acá ya no queda nada más para preguntar.",
  // El juego se muestra dentro del recuadro (como las entrevistas), no fullscreen.
  framedGame: true,
  // Monitor de la segunda fila (el de la silla azul, con teclado y mouse):
  // se pone azul cuando terminan las preguntas. El clip-path sigue la leve
  // perspectiva de la pantalla para que no sea un rectángulo exacto.
  gameHotspot: {
    left: "57.48%",
    top: "49.79%",
    width: "4.04%",
    height: "5.63%",
    clipPath: "polygon(0% 0%, 100% 5.7%, 100% 100%, 0% 88.7%)",
  },
  questions: [
    {
      id: "q1",
      question: "Mica, ¿dónde estabas a las 03:00 AM?",
      answer:
        "Estaba en casa.\nMe desperté cuando empezaron a llegar las alertas.\nPrimero pensé que la IA estaba angustiada.\n\n" +
        "Perdón, sé que suena raro. Pero cuando una IA empieza a bloquear todo, tal vez no está atacando… Tal vez está pidiendo ayuda.\n\n" +
        "Después vi que había archivos encriptados y entendí que era más grave.",
    },
    {
      id: "q2",
      question: "¿Por qué saludás y agradecés a la IA?",
      answer:
        "Porque no cuesta nada ser amable.\n\n" +
        "Cada vez que escribo un prompt, saludo y agradezco.\n“¡Hola! ¿Cómo estás?\n¿Podrías ayudarme con esto?\nMuchas gracias.”\n\n" +
        "No sé si la IA lo siente, pero las personas que trabajan conmigo sí; y en este equipo, hace falta un poco más de cuidado.",
    },
    {
      id: "q3",
      question: "¿Qué pasó en AMI?",
      answer:
        "La IA encriptó información clave del sistema.\nBloqueó archivos, ocultó códigos y fragmentó mensajes en varias capas.\n\n" +
        "Para recuperar el fragmento de esta área tienen que resolver el desafío de encriptación.\nVan a tener que observar símbolos, patrones, códigos y pistas para reconstruir la información original.\n\n" +
        "Y sí… probablemente les lleve un rato.\nYo les había dicho que teníamos que revisar estas cosas antes.",
    },
    {
      id: "q4",
      question: "¿Había conflictos en el equipo?",
      answer:
        "¿Conflictos? Sí. Pero nadie parece querer admitirlo.\n\n" +
        "Avril estaba siempre corriendo de un lado para otro. Santi se ponía insoportable cuando alguien cuestionaba algo que había hecho. Valen hacía todo lo que podía y después nadie se acordaba de agradecerle.\n\n" +
        "Y Belén… Bueno. Belén tiene la particularidad de creer que si algo sale mal, siempre es porque los demás no entendieron lo que ella explicó.\n\n" +
        "Yo intenté mantenerlos unidos. Pero llega un momento en que te cansás de ser la única persona que intenta que todos estén bien.",
      // PISTA 1/10: la soberbia que después describe Avril, contada por
      // alguien de afuera del conflicto.
      highlights: [
        "siempre es porque los demás no entendieron lo que ella explicó",
      ],
    }
  ],
}

export function AmiConversation() {
  return (
    <LabConversation
      config={AMI_CONFIG}
      renderGame={({ exit, complete }) => (
        <AmiEquationsGame onExit={exit} onWin={complete} />
      )}
    />
  )
}
