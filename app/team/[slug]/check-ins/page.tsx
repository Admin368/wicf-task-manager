"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, parseISO, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  Loader2,
  Calendar as CalendarIcon,
  Users,
} from "lucide-react";
import { api } from "@/lib/trpc/client";
import { DatePicker } from "@/components/date-picker";
// import { UserList } from "@/components/user-list";
import { toast } from "@/components/ui/use-toast";
import { UserListCheckIns } from "@/components/user-list-checkins";

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
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [teamLoaded, setTeamLoaded] = useState(false);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: teamData, isLoading: teamLoading } =
    api.teams.getBySlug.useQuery(
      { slug },
      {
        onError: (error) => {
          toast({
            title: "Error",
            description: "Team not found or you don't have access.",
            variant: "destructive",
          });
          router.push("/");
        },
      }
    );
  const { team, teamMembers } = teamData || {};

  // Use the team id from the data
  const currentTeamId = team?.id || "";

  // Verify team access
  const { data: accessData } = api.teams.verifyAccess.useQuery(
    { teamId: team?.id || "" },
    {
      enabled: !!team?.id,
      onSuccess: (data) => {
        if (!data.hasAccess) {
          router.push(`/team/${slug}/join`);
        } else {
          setTeamLoaded(true);
        }
      },
      onError: () => {
        router.push(`/team/${slug}/join`);
      },
    }
  );

  // Get check-ins for the selected date
  const { data: checkIns, isLoading: checkInsLoading } =
    api.checkIns.getByTeamAndDate.useQuery(
      {
        teamId: currentTeamId,
        date: formattedDate,
      },
      {
        enabled: !!currentTeamId && teamLoaded,
        retry: false,
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to get check-ins. Please refresh the page.",
            variant: "destructive",
          });
        },
      }
    );

  // Get daily history
  const { data: history, isLoading: historyLoading } =
    api.checkIns.getHistory.useQuery(
      {
        teamId: currentTeamId,
        limit: 30,
      },
      {
        enabled: !!currentTeamId && teamLoaded,
        retry: false,
        onError: (error) => {
          toast({
            title: "Error",
            description:
              "Failed to get check-in history. Please refresh the page.",
            variant: "destructive",
          });
        },
      }
    );

  const totalMembers = teamMembers?.length || 0;
  const checkedInCount = checkIns?.length || 0;

  const goBack = () => {
    router.push(`/team/${slug}`);
  };

  if (teamLoading || !teamLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="container px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Daily Check-ins</h1>
        <Button
          variant="outline"
          onClick={() => router.push(`/team/${slug}/check-ins/history`)}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Calendar className="h-4 w-4" />
          <span>View History</span>
        </Button>
      </div>

      <div className="space-y-4 mt-4">
        {/* <CheckInButton teamId={team.id} /> */}
        {/* <CheckInStatusBar teamId={team.id} totalMembers={totalMembers} /> */}

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 px-3 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Select Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full p-2 sm:p-6">
            <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 px-3 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">
                Check-ins for {format(selectedDate, "MMM d, yyyy")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 py-1 sm:px-6 sm:py-3">
            {checkInsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : checkIns && checkIns.length > 0 ? (
              <UserListCheckIns
                checkIns={checkIns}
                onClose={() => {}}
                showTime
                teamId={team.id}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-muted-foreground/50" />
                <h3 className="text-base sm:text-lg font-medium mb-1">
                  No Check-ins
                </h3>
                <p className="max-w-sm mb-4 sm:mb-6 text-sm sm:text-base">
                  No team members have checked in for this date yet.
                </p>

                {format(selectedDate, "yyyy-MM-dd") ===
                  format(new Date(), "yyyy-MM-dd") && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("check-in-button")?.click()
                    }
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
  );
}
