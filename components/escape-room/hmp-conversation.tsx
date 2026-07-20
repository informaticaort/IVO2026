"use client"

import { LabConversation, type LabConversationConfig } from "./lab-conversation"
import { HmpSequenceGame } from "./hmp-sequence-game"

/* -------------------------------------------------------------------------
 * CONVERSACIÓN DEL ÁMBITO HMP — Sospechoso: VALEN (Hardware / Realidad Virtual)
 * ---------------------------------------------------------------------- */
const HMP_CONFIG: LabConversationConfig = {
  acronym: "HMP",
  speaker: "Valen",
  greeting:
    "Eh… hola. Soy Valen. Perdón, estoy medio disperso, tengo mil cosas pendientes. Pero dale, preguntá… intento ayudar, creo.",
  closingSpeech:
    "Ok, ok… arranquemos con los desafíos de realidad virtual. Conecten bien los cables y sigan las secuencias de símbolos. Sí, eso. Bastante seguro.",
  completedSpeech:
    "Uf, la secuencia quedó sincronizada y el pendrive recuperó el fragmento de HMP. Ya está, bastante seguro. Podés revisar el registro de la entrevista si querés.",
  // El juego se muestra dentro del recuadro (como las entrevistas), no fullscreen.
  framedGame: true,
  questions: [
    {
      id: "q1",
      question: "Valen, ¿qué hacías a las 03:00 AM?",
      answer:
        "¿A las 03:00 AM? No sé... esperen. Sí, sí sé, creo. " +
        "Estaba en mi casa intentando terminar un informe que era para ayer. O para antes de ayer. No, pará… el informe era para hoy, pero también tenía pendiente calibrar los cascos de VR. " +
        "A ver, no estuve acá. Eso seguro. O casi seguro. No, seguro. Tengo mensajes enviados desde mi casa como a las 02:40 que dicen “ya casi termino”, que es mentira porque no terminé nada.",
    },
    {
      id: "q2",
      question: "¿Qué pasó en HMP?",
      answer:
        "Todo se desconfiguró. " +
        "Los cascos de realidad virtual muestran escenarios mezclados, los cables no coinciden con las terminales, los sensores responden tarde y las secuencias de símbolos aparecen en cualquier orden. " +
        "La IA convirtió el área en una especie de sala de escape dentro de la sala de escape. Lo cual sería interesante si yo no tuviera quince cosas pendientes.",
    },
    {
      id: "q3",
      question: "¿Qué tienen que hacer los jugadores en esta área?",
      answer:
        "Tienen que resolver los desafíos de realidad virtual. " +
        "Primero, conectar o identificar cables siguiendo pistas lógicas. No es al azar. Hay que comunicarse, leer bien y decidir qué va con qué. " +
        "Después, resolver secuencias de símbolos. El sistema les va a mostrar patrones y ustedes tienen que ingresarlos en el orden correcto. " +
        "Si completan eso, el pendrive recupera el fragmento de HMP.",
    },
    {
      id: "q4",
      question: "¿Viste algo raro antes de irte?",
      answer:
        "Sí. O sea, creo que sí. " +
        "Vi a Belen discutiendo con Avril por permisos de acceso. Belen decía que el sistema estaba mal diseñado y que si algo fallaba, iba a ser culpa de Avril. " +
        "Después vi a Mica intentando calmarlas. Le dijo “por favor” a la IA cuando se trabó la pantalla. No sé si cuenta como raro porque Mica hace eso siempre.",
    },
    {
      id: "q5",
      question: "¿Creés que Avril pudo haberlo hecho?",
      answer:
        "No sé. Avril llega tarde, se olvida reuniones, pierde cosas… pero sabotear su propio proyecto me parece mucho. " +
        "Además, si Avril quisiera romper algo, probablemente llegaría tarde también al sabotaje. " +
        "Perdón, no debería bromear. Estoy nervioso.",
    },
    {
      id: "q6",
      question: "¿Qué pista importante tenés?",
      answer:
        "Hay algo que no me cierra. " +
        "La IA alteró primero los sistemas que podían registrar actividad: accesos, logs, sensores. Eso parece planeado. " +
        "Y el desafío de HMP quedó intervenido de una manera muy específica, como si alguien conociera cómo usamos la realidad virtual para entrenar al equipo. " +
        "No fue un ataque cualquiera. Fue alguien de adentro. Casi seguro. Bueno, bastante seguro. No sé. Anoten “bastante seguro”.",
    },
  ],
}

export function HmpConversation() {
  return (
    <LabConversation
      config={HMP_CONFIG}
      renderGame={({ exit, complete }) => (
        <HmpSequenceGame onExit={exit} onWin={complete} />
      )}
    />
  )
}
