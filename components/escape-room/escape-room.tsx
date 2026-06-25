"use client"

import { useState } from "react"
import { WelcomeScreen } from "./welcome-screen"
import { TeamSetupScreen, type TeamData } from "./team-setup-screen"
import { ProcessingScreen } from "./processing-screen"

type Step = "welcome" | "setup" | "processing"

export function EscapeRoom() {
  const [step, setStep] = useState<Step>("welcome")
  const [team, setTeam] = useState<TeamData>({ name: "", avatar: null })

  if (step === "welcome") {
    return <WelcomeScreen onStart={() => setStep("setup")} />
  }

  if (step === "setup") {
    return (
      <TeamSetupScreen
        onContinue={(data) => {
          setTeam(data)
          setStep("processing")
        }}
      />
    )
  }

  return <ProcessingScreen team={team} />
}
