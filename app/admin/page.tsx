import { Suspense } from "react"

import { BackofficePanel } from "@/components/admin/backoffice-panel"

export const metadata = {
  title: "Monitoreo en vivo | Backoffice",
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="font-mono text-sm text-muted-foreground">Cargando panel…</p>
        </main>
      }
    >
      <BackofficePanel />
    </Suspense>
  )
}
