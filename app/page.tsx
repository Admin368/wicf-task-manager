import { TeamsList } from "@/components/teams-list"

export default function Home() {
  return (
    <main className="container mx-auto py-6 max-w-5xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Task Manager</h1>
          <p className="text-muted-foreground">
            Join or create a team to manage tasks together.
          </p>
        </div>
        
        <TeamsList />
      </div>
    </main>
  )
}

