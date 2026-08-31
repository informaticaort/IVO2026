"use client"

import { useState } from "react"
import { WelcomeScreen } from "./welcome-screen"
import { LogoPromptScreen } from "./logo-prompt-screen"
import { TeamSetupScreen, type TeamData } from "./team-setup-screen"
import { ProcessingScreen } from "./processing-screen"

type Step = "welcome" | "logo" | "setup" | "processing"

export function EscapeRoom() {
  const [step, setStep] = useState<Step>("welcome")
  const [team, setTeam] = useState<TeamData>({ name: "", avatar: null })
  // Nombre elegido en el taller de logo: precarga el registro para que no
  // tengan que escribirlo dos veces.
  const [suggestedName, setSuggestedName] = useState("")

  if (step === "welcome") {
    return <WelcomeScreen onStart={() => setStep("setup")} />
  }

  if (step === "logo") {
    return (
      <LogoPromptScreen
        onContinue={(briefing) => {
          setSuggestedName(briefing.teamName)
          setStep("setup")
        }}
      />
    )
  }

  if (step === "setup") {
    return (
      <TeamSetupScreen
        initialName={suggestedName}
        onContinue={(data) => {
          setTeam(data)
          setStep("processing")
        }}
      />
    )
  }

  return <ProcessingScreen team={team} />
}
