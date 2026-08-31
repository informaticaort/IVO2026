"use client"

import { LabConversation, type LabConversationConfig } from "./lab-conversation"
import { CeoDesktopGame } from "./ceo-desktop-game"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO CEO — Sospechosa: BELEN (Programación)
 * ---------------------------------------------------------------------- */
const CEO_CONFIG: LabConversationConfig = {
  acronym: "CEO",
  speaker: "Belén",
  greeting:
    "Soy Belén. Programación. Dale, preguntá lo que quieras… total ya decidieron que soy sospechosa antes de escucharme.",
  closingSpeech:
    "Bien. Suficiente charla. Fíjense en esa computadora del fondo: se encendió sola con el desafío de programación cargado… a ver si son tan rápidos como dicen.",
  password: "HACK3D",
  completedSpeech:
    "Ya está, el desafío de programación quedó resuelto y el pendrive tiene su fragmento. No hace falta que sigan preguntando; si quieren, revisen el registro de la entrevista. Yo ya dije todo lo que tenía para decir.",
  // Monitor de la izquierda (el que está a la izquierda del más cercano, sobre
  // el mismo escritorio): se enciende cuando terminan las preguntas. El hotspot
  // se ajusta al vidrio de la pantalla para que el recorte quede dentro del
  // marco. Es casi frontal, así que no necesita clip-path.
  gameHotspot: {
    left: "66.3%",
    top: "57.5%",
    width: "8.4%",
    height: "9.7%",
    // La "pantalla prendida" muestra el mismo escritorio que van a ver al
    // entrar, en vez de la pantalla azul genérica ":(". Escritorio.png ya es
    // la pantalla completa, así que entra entera y no hace falta recortarla.
    preview: {
      image: "/images/Escritorio.png",
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
    },
    // No es la pantalla azul genérica: muestra el escritorio real, así que el
    // aviso y el aria-label lo describen en vez de hablar de "azul".
    hotspotLabel: "Computadora encendida con el escritorio: iniciar el juego",
    hotspotMessage:
      "Ya preguntaste todo. Una de las computadoras se encendió… hacé clic en ella.",
  },
  questions: [
    {
      id: "q1",
      question: "Belén, ¿dónde estabas a las 03:00 AM?",
      answer:
        "En mi casa. Durmiendo.\nY antes de que me pregunten: sí, también tengo registros que lo pueden comprobar.\n\n" +
        "Aunque, si quieren mi opinión, deberíamos estar preguntándonos otra cosa: ¿cómo consiguió alguien usar una credencial ajena para ejecutar una acción tan crítica?\nEso es un problema de seguridad bastante más interesante.\n\n" +
        "Pero bueno… ustedes pregunten y yo respondo.",
    },
    {
      id: "q2",
      question:
        "El sabotaje se hizo con código. Vos trabajás en Programación. ¿Eso no te compromete?",
      answer:
        "¿Me compromete saber programar? Entonces estamos en problemas, porque medio equipo debería estar detenido.\n\n" +
        "Una cosa es escribir código y otra muy distinta es sabotear un sistema.\n\n" +
        "Además, miren el código antes de acusar. Tiene errores bastante básicos. Yo no programaría así.\nBueno… probablemente sí cometería errores, pero no esos.",
      // PISTA 3/10: se despega de un código torpe… pero el código corrupto es
      // justamente prolijo (ver la pista de Avril y la de Santi).
      highlights: ["Tiene errores bastante básicos. Yo no programaría así"],
    },
    {
      id: "q3",
      question: "¿Cómo era tu relación con Avril?",
      answer:
        "Normal.\nBueno… normal dentro de lo que puede ser trabajar con Avril.\n\n" +
        "Ella tiene buenas ideas y es una buena líder, pero tiene una relación bastante complicada con los horarios.\n\n" +
        "Yo le decía que teníamos que revisar los permisos antes de la presentación y ella decía: “Sí, sí, después lo vemos.” Ese “después” eventualmente se convirtió en un problema.\n\n" +
        "Pero tampoco exageremos. Discutir por cuestiones de trabajo no significa querer sabotear a alguien. Si fuera así, tendría que sabotear a todo el equipo.",
    },
    {
      id: "q4",
      question: "¿Qué hizo la IA en el área CEO?",
      answer:
        "Alteró módulos de programación, mezcló instrucciones y rompió partes del flujo lógico del sistema.\n\n" +
        "Para recuperar el fragmento de esta área, tienen que resolver el desafío de programación: ordenar instrucciones, detectar errores y reconstruir la secuencia correcta.\n\n" +
        "Básicamente, hacer lo que yo hago todos los días, pero más lento.",
    },
    {
      id: "q5",
      question: "Algunos dicen que tuviste discusiones fuertes con el equipo.",
      answer:
        "¿Fuertes? No. Yo diría que fueron… educativas.\n\n" +
        "Miren, tengo un pequeño defecto: cuando veo algo mal, lo digo. Y aparentemente eso no siempre cae bien.\n\n" +
        "Santi se obsesiona con detalles. Valen intenta hacer veinte cosas al mismo tiempo. Mica le habla a la IA como si fuera una mascota. Y Avril… bueno, Avril tiene demasiadas cosas en la cabeza.\n\n" +
        "Pero eso no significa que no los valore. Si realmente quisiera que todo saliera mal, créanme que no estaría intentando arreglarlo ahora.\n\n" +
        "Y ahora resulta que por decir lo que pienso soy sospechosa, re heavy, re pesado.",
      // PISTA 4/10: su muletilla. Aparece escrita al revés dentro del código
      // corrupto del juego de CEO ("// nota: odasep er yvaeh er").
      highlights: ["re heavy, re pesado"],
    },
    {
      id: "q6",
      question: "¿Creés que Avril es culpable?",
      answer:
        "No.\n\n" +
        "¿Descuidó su credencial? Sí. ¿Debería haber tenido mejores controles de acceso? También.\nPero de ahí a decir que sabotearía su propio proyecto… no me cierra.\n\n" +
        "Además, hay algo que deberían tener en cuenta. Si alguien quería culpar a Avril, usar su credencial era demasiado obvio. Es casi como dejar un cartel que diga: “Hola, soy el culpable. Besitos.”\n\n" +
        "Y eso me lleva a otra posibilidad. Quizás quien hizo esto quería que sospecháramos de Avril. O de alguien más.\n\n" +
        "No sé quién fue. Pero si me preguntan, yo empezaría mirando quién tuvo acceso a las áreas y quién sabía exactamente qué sistemas atacar.\nEso les va a decir mucho más que quién discutió con quién.",
    },
  ],
}

export function CeoConversation() {
  return (
    <LabConversation
      config={CEO_CONFIG}
      renderGame={({ exit, complete }) => (
        <CeoDesktopGame onExit={exit} onWin={complete} />
      )}
    />
  )
}
