"use client"

import { useEffect, useState } from "react"

import { ProcessingScreen } from "@/components/escape-room/processing-screen"
import type { TeamData } from "@/components/escape-room/team-setup-screen"

const DEFAULT_TEAM: TeamData = {
  name: "Equipo",
  avatar: null,
}

export default function PlanoPage() {
  const [team, setTeam] = useState<TeamData>(DEFAULT_TEAM)

  useEffect(() => {
    const savedTeam = sessionStorage.getItem("escape-room-team")
    if (!savedTeam) return

    try {
      const parsedTeam = JSON.parse(savedTeam) as TeamData
      if (parsedTeam.name) {
        setTeam({
          name: parsedTeam.name,
          avatar: parsedTeam.avatar ?? null,
        })
      }
    } catch {
      setTeam(DEFAULT_TEAM)
    }
  }, [])

  return <ProcessingScreen team={team} />
}