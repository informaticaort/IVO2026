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
    "Hola, ¿cómo estás? Soy Mica. Preguntame lo que necesites, con tranquilidad… quiero que esto se resuelva bien.",
  closingSpeech:
    "Bien. Esa computadora quedó bloqueada por la IA… resuelvan las ecuaciones con calma y conviertan cada número en su letra.",
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
        "Estaba en casa. Me desperté cuando empezaron a llegar las alertas. " +
        "Primero pensé que la IA estaba angustiada. Perdón, sé que suena raro, pero cuando una IA empieza a bloquear todo, tal vez no está atacando… tal vez está pidiendo ayuda. " +
        "Después vi que había archivos encriptados y entendí que era más grave.",
    },
    {
      id: "q2",
      question: "¿Por qué saludás y agradecés a la IA?",
      answer:
        "Porque no cuesta nada ser amable. " +
        "Cada vez que escribo un prompt, saludo y agradezco. “¡Hola! ¿Cómo estás? ¿Podrías ayudarme con esto? Muchas gracias.” " +
        "No sé si la IA lo siente, pero las personas que trabajan conmigo sí. Y en este equipo hace falta un poco más de cuidado.",
    },
    {
      id: "q3",
      question: "¿Qué pasó en AMI?",
      answer:
        "La IA encriptó información clave del sistema. Bloqueó archivos, ocultó códigos y fragmentó mensajes en varias capas. " +
        "Para recuperar el fragmento de esta área, tienen que resolver el desafío de encriptación. Van a tener que observar símbolos, patrones, códigos y pistas para reconstruir la información original. " +
        "Si lo logran, el pendrive va a recuperar el fragmento correspondiente.",
    },
    {
      id: "q4",
      question: "¿Había conflictos en el equipo?",
      answer:
        "Sí. Intenté mediar varias veces. " +
        "Alex estaba muy presionado porque la presentación se acercaba. Santi se frustraba cuando nadie revisaba los detalles. Valen estaba completamente sobrepasado. Y Belen… Belen se enojaba cuando alguien cuestionaba su código. " +
        "No creo que nadie sea malo. Pero cuando las personas están cansadas y se sienten atacadas, pueden tomar decisiones horribles.",
    },
    {
      id: "q5",
      question: "¿Viste algo raro antes del sabotaje?",
      answer:
        "Vi a Belen muy alterada después de una reunión con Alex. Decía que si el sistema fallaba, ella no iba a cargar con la culpa de errores ajenos. " +
        "También escuché que Alex no encontraba su credencial. Pensé que la había perdido como otras veces, porque siempre llega tarde, se apura y deja cosas por cualquier lado. " +
        "Ahora me preocupa que alguien se haya aprovechado de eso.",
    },
    {
      id: "q6",
      question: "¿Creés que la IA actuó sola?",
      answer:
        "No del todo. " +
        "Creo que la IA está reaccionando a una instrucción corrupta. Como si alguien le hubiera dado una orden maliciosa y ella estuviera intentando cumplirla sin entender el daño. " +
        "Por eso tenemos que desinfectarla, no destruirla. " +
        "Y también tenemos que descubrir quién le dio esa orden."
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
