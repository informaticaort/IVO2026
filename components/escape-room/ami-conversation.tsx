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
    "¡Hola! ¿Cómo estás? Soy Mica.\nPreguntame lo que necesites, con tranquilidad… \n Quiero que esto se resuelva bien.",
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
        "Estaba en casa.\nMe desperté cuando empezaron a llegar las alertas. " +
        "\nPrimero pensé que la IA estaba angustiada. \n\nPerdón, sé que suena raro.\nPero cuando una IA empieza a bloquear todo. \nTal vez no está atacando… Tal vez está pidiendo ayuda. " +
        "\n\nDespués vi que había archivos encriptados y entendí que era más grave.",
    },
    {
      id: "q2",
      question: "¿Por qué saludás y agradecés a la IA?",
      answer:
        "Porque no cuesta nada ser amable.\n\n" +
        "Cada vez que escribo un prompt, saludo y agradezco.\n“¡Hola! ¿Cómo estás?\n¿Podrías ayudarme con esto?\nMuchas gracias.”\n\n" +
        "No sé si la IA lo siente,\npero las personas que trabajan conmigo sí;\ny en este equipo, hace falta un poco más de cuidado.",
    },
    {
      id: "q3",
      question: "¿Qué pasó en AMI?",
      answer:
        "La IA encriptó información clave del sistema.\nBloqueó archivos, ocultó códigos y fragmentó mensajes en varias capas.\n\n" +
        "Para recuperar el fragmento de esta área, tienen que resolver el desafío de encriptación.\n\n" +
        "Van a tener que observar símbolos, patrones, códigos y pistas para reconstruir la información original. " +
        "\n\nSi lo logran, el pendrive va a recuperar el fragmento correspondiente.",
    },
    {
      id: "q4",
      question: "¿Había conflictos en el equipo?",
      answer:
        "Sí. Intenté mediar varias veces.\n\n" +
        "Avril estaba muy presionada porque la presentación se acercaba. Santi se frustraba cuando nadie revisaba los detalles. Valen estaba completamente sobrepasado. Y Belen… Belen se enojaba cuando alguien cuestionaba su código.\n\n" +
        "No creo que nadie sea malo.\nPero cuando las personas están cansadas y se sienten atacadas, pueden tomar decisiones horribles.",
      highlights: ["Belen se enojaba cuando alguien cuestionaba su código"],
    },
    {
      id: "q5",
      question: "¿Viste algo raro antes del sabotaje?",
      answer:
        "Vi a Belen muy alterada después de una reunión con Avril.Decía que si el sistema fallaba, ella no iba a cargar con la culpa de errores ajenos. " +
        "\n\nTambién escuché que Avril no encontraba su credencial.\nPensé que la había perdido como otras veces, porque siempre llega tarde, se apura y deja cosas por cualquier lado. " +
        "\n\nAhora me preocupa que alguien se haya aprovechado de eso.",
      highlights: [
        "Belen muy alterada después de una reunión con Avril",
        "no iba a cargar con la culpa de errores ajenos",
        "Avril no encontraba su credencial",
      ],
    },
    {
      id: "q6",
      question: "¿Creés que la IA actuó sola?",
      answer:
        "No del todo.\n\n" +
        "Creo que la IA está reaccionando a una instrucción corrupta. Como si alguien le hubiera dado una orden maliciosa y ella estuviera intentando cumplirla sin entender el daño.\n\n" +
        "Por eso tenemos que desinfectarla, no destruirla." +
        "\nY también tenemos que descubrir quién le dio esa orden.",
      highlights: ["alguien le hubiera dado una orden maliciosa"],
    },
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
