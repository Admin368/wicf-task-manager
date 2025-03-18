"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO, subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { DatePicker } from "@/components/date-picker"
import { UserList } from "@/components/user-list"
import { toast } from "@/components/ui/use-toast"
import { CheckInButton } from "@/components/check-in-button"
import { CheckInStatusBar } from "@/components/check-in-status-bar"
import { cn } from "@/lib/utils"

interface HistoryItem {
  check_in_date: string;
  check_in_count: number;
}

interface CheckIn {
  id: string;
  userId: string;
  checkInDate: string;
  checkedInAt: string;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export default function CheckInsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [teamLoaded, setTeamLoaded] = useState(false)
  
  const formattedDate = format(selectedDate, "yyyy-MM-dd")
  
  const { data: team, isLoading: teamLoading } = api.teams.getBySlug.useQuery({ slug }, {
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
  
  // Get team members
  const { data: teamMembers } = api.users.getTeamMembers.useQuery(
    { teamId: team?.id || "" },
    { enabled: !!team?.id && teamLoaded }
  )
  
  // Get check-ins for the selected date
  const { data: checkIns, isLoading: checkInsLoading } = api.checkIns.getByTeamAndDate.useQuery(
    { 
      teamId: team?.id || "", 
      date: formattedDate 
    },
    { enabled: !!team?.id && teamLoaded }
  )
  
  // Get daily history
  const { data: history, isLoading: historyLoading } = api.checkIns.getHistory.useQuery(
    { 
      teamId: team?.id || "",
      limit: 30
    },
    { enabled: !!team?.id && teamLoaded }
  )
  
  const totalMembers = teamMembers?.length || 0
  const checkedInCount = checkIns?.length || 0
  
  const goBack = () => {
    router.push(`/team/${slug}`)
  }

  if (teamLoading || !teamLoaded) {
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
      <div className="mb-6">
        <Button variant="ghost" onClick={goBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Team
        </Button>
        <h1 className="text-2xl font-bold">{team.name} Check-ins</h1>
        <p className="text-muted-foreground">View and manage daily team attendance</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <CheckInButton teamId={team.id} />
          <CheckInStatusBar teamId={team.id} totalMembers={totalMembers} />
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Select Date</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Check-in Days</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !history || history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No check-in history available.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {history.slice(0, 20).map((day: HistoryItem) => (
                    <div 
                      key={day.check_in_date} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded cursor-pointer",
                        formattedDate === day.check_in_date ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      onClick={() => setSelectedDate(parseISO(day.check_in_date))}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn(
                            "w-2 h-2 rounded-full",
                            Number(day.check_in_count) > 0 ? "bg-green-500" : "bg-red-500"
                          )}
                        />
                        <span>{format(parseISO(day.check_in_date), "EEE, MMM d")}</span>
                      </div>
                      <span className="font-medium">
                        {day.check_in_count} {Number(day.check_in_count) === 1 ? "member" : "members"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Check-ins for {format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  {checkedInCount} of {totalMembers} members
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkInsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : checkIns && checkIns.length > 0 ? (
                <UserList 
                  teamMembers={checkIns.map((c: CheckIn) => ({ 
                    id: c.userId,
                    name: c.user.name || 'Unknown',
                    email: c.user.email,
                    avatar_url: c.user.avatar_url,
                    role: 'member',
                    notes: c.notes,
                    checkedInAt: c.checkedInAt
                  }))} 
                  onClose={() => {}} 
                  showTime
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-1">No Check-ins</h3>
                  <p className="max-w-sm mb-6">No team members have checked in for this date yet.</p>
                  
                  {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
                    <Button 
                      variant="outline"
                      onClick={() => document.getElementById('check-in-button')?.click()}
                    >
                      Check In Now
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 