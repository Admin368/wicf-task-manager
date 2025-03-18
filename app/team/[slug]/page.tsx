"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TaskList } from "@/components/task-list"
import { api } from "@/lib/trpc/client"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [teamLoaded, setTeamLoaded] = useState(false)
  
  const { data: team, isLoading } = api.teams.getBySlug.useQuery({ slug }, {
    onError: (error) => {
      toast({
        title: "Error",
        description: "Team not found or you don't have access.",
        variant: "destructive",
      })
      router.push("/")
    },
  })
  
  // Verify team access
  const { data: accessData } = api.teams.verifyAccess.useQuery(
    { teamId: team?.id || "" },
    { 
      enabled: !!team?.id,
      onSuccess: (data) => {
        if (!data.hasAccess) {
          toast({
            title: "Access Denied",
            description: "You don't have access to this team.",
            variant: "destructive",
          })
          router.push("/")
        } else {
          setTeamLoaded(true)
        }
      },
      onError: () => {
        router.push("/")
      }
    }
  )

  if (isLoading || !teamLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!team) {
    return null
  }

  return (
    <TaskList teamId={team.id} teamName={team.name} />
  )
} 