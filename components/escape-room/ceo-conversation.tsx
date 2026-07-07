"use client"

import { LabConversation, type LabConversationConfig } from "./lab-conversation"
import { CeoDesktopGame } from "./ceo-desktop-game"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO CEO — Sospechosa: BELEN (Programación)
 * ---------------------------------------------------------------------- */
const CEO_CONFIG: LabConversationConfig = {
  acronym: "CEO",
  speaker: "Belen",
  greeting:
    "Soy Belen. Programación. Dale, preguntá lo que quieras… total ya decidieron que soy sospechosa antes de escucharme.",
  closingSpeech:
    "Bien. Suficiente charla. Fíjense en esa computadora del fondo: se encendió sola con el desafío de programación cargado… a ver si son tan rápidos como dicen.",
  // Monitor más cercano, en el escritorio de adelante a la derecha: se pone
  // azul cuando terminan las preguntas. Es casi frontal, así que no necesita
  // clip-path (la pantalla ya se ve como un rectángulo).
  gameHotspot: {
    left: "80.9%",
    top: "72.2%",
    width: "12.4%",
    height: "12.9%",
    // Recorte de la pantalla del escritorio real (CeoDesktopPixelArt.png,
    // 1672x941) para que la "pantalla prendida" muestre el mismo fondo que
    // van a ver al entrar, en vez de la pantalla azul genérica ":(".
    preview: {
      image: "/images/CeoDesktopPixelArt.png",
      backgroundSize: "189.35% 200.21%",
      backgroundPosition: "22.05% 18.47%",
    },
  },
  questions: [
    {
      id: "q1",
      question: "Belen, ¿dónde estabas a las 03:00 AM?",
      answer:
        "En mi casa. Durmiendo, claramente. " +
        "Aunque si me preguntan, el verdadero problema no es dónde estaba yo, sino por qué el sistema permitió que una credencial como la de Alex pudiera ejecutar algo tan crítico sin una segunda validación. " +
        "Pero bueno, eso ya lo había dicho yo antes. Nadie me escuchó.",
    },
    {
      id: "q2",
      question:
        "El sabotaje se hizo con código. Vos trabajás en Programación. ¿Eso no te compromete?",
      answer:
        "No. Me compromete saber programar, no sabotear. " +
        "Que alguien haya escrito código corrupto no significa que lo haya hecho yo. En esta empresa todos tocan algo del sistema, aunque algunos lo hagan bastante mal. " +
        "Además, si yo hubiera escrito ese código, no habría fallado de esta manera. Habría sido más limpio, más preciso y, sinceramente, más difícil de detectar.",
    },
    {
      id: "q3",
      question: "¿Cómo era tu relación con Alex?",
      answer:
        "Alex es buen líder cuando llega. El problema es que casi nunca llega a tiempo. " +
        "Siempre apurado, siempre improvisando, siempre diciendo “después lo vemos”. Y después, claro, pasan estas cosas. " +
        "Yo le advertí que había que reforzar permisos, revisar accesos y separar responsabilidades. No me hizo caso. " +
        "Ahora todos miran sorprendidos el incendio que yo ya había señalado.",
    },
    {
      id: "q4",
      question: "¿Qué hizo la IA en el área CEO?",
      answer:
        "Alteró módulos de programación, mezcló instrucciones y rompió partes del flujo lógico del sistema. " +
        "Para recuperar el fragmento de esta área, tienen que resolver el desafío de programación: ordenar instrucciones, detectar errores y reconstruir la secuencia correcta. " +
        "Básicamente, hacer lo que yo hago todos los días, pero más lento.",
    },
    {
      id: "q5",
      question: "Algunos dicen que tuviste discusiones fuertes con el equipo.",
      answer:
        "Porque el equipo se equivoca y alguien tiene que decirlo. " +
        "Santi se obsesiona con detalles mínimos. Valen vive colapsado, entonces deja cosas a medias. Mica le habla a la IA como si fuera una mascota. " +
        "Yo soy el único que se toma en serio la arquitectura del sistema. " +
        "Y ahora resulta que por tener razón soy sospechoso. Re heavy re pesado.",
    },
    {
      id: "q6",
      question: "¿Creés que Alex es culpable?",
      answer:
        "No sé si culpable, pero responsable seguro. " +
        "Su credencial fue usada. Su control falló. Su proyecto explotó. " +
        "¿Que alguien pudo haberle robado el acceso? Sí, obvio. Pero eso también habla mal de él. " +
        "En programación hay una regla básica: si tu sistema permite un desastre, el desastre también es parte de tu diseño.",
    },
  ],
}

export function CeoConversation() {
  return (
    <LabConversation
      config={CEO_CONFIG}
      renderGame={({ exit }) => <CeoDesktopGame onExit={exit} />}
    />
  )
}
