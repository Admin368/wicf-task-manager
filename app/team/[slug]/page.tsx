"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TaskList } from "@/components/task-list"
import { api } from "@/lib/trpc/client"
import { Loader2, ExternalLink } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { CheckInButton } from "@/components/check-in-button"
import { CheckInStatusBar } from "@/components/check-in-status-bar"
import { CheckInHistory } from "@/components/check-in-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [teamLoaded, setTeamLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("tasks")
  
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

  // Get team members count for check-in status
  const { data: teamMembers } = api.users.getTeamMembers.useQuery(
    { teamId: team?.id || "" },
    { enabled: !!team?.id && teamLoaded }
  )

  const totalMembers = teamMembers?.length || 0

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
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar for check-ins */}
        <div className="space-y-6">
          <CheckInButton teamId={team.id} />
          <CheckInStatusBar teamId={team.id} totalMembers={totalMembers} />
          <CheckInHistory teamId={team.id} />
          
          <Button variant="outline" className="w-full" onClick={() => router.push(`/team/${slug}/check-ins`)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Check-in History
          </Button>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <TaskList teamId={team.id} teamName={team.name} />
            </TabsContent>
            <TabsContent value="analytics">
              <div className="p-6 border rounded-md">
                <h2 className="text-xl font-semibold mb-4">Team Analytics</h2>
                <p className="text-muted-foreground">
                  Analytics features coming soon. Check back later for team performance metrics.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 