"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  Loader2,
  TrendingUp,
  Users,
  Filter,
} from "lucide-react";
import { api } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Bar } from "@/components/ui/simple-bar-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoryItem {
  check_in_date: string;
  check_in_count: number;
}

export default function CheckInHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [view, setView] = useState("chart");
  const [historyDays, setHistoryDays] = useState(30);
  const [teamLoaded, setTeamLoaded] = useState(false);

  // Get team data
  const { data: team, isLoading: teamLoading } = api.teams.getBySlug.useQuery(
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

  // Get team members count
  const { data: teamMembers } = api.users.getTeamMembers.useQuery(
    { teamId: team?.id || "" },
    { enabled: !!team?.id && teamLoaded }
  );

  // Get check-in history
  const { data: history, isLoading: historyLoading } =
    api.checkIns.getHistory.useQuery(
      {
        teamId: team?.id || "",
        limit: historyDays,
      },
      { enabled: !!team?.id && teamLoaded }
    );

  const totalMembers = teamMembers?.length || 0;

  // Process chart data
  const chartData = history
    ? history
        .map((day: HistoryItem) => ({
          name: format(parseISO(day.check_in_date), "MMM d"),
          value: Number(day.check_in_count),
          percentage: Math.round(
            (Number(day.check_in_count) / totalMembers) * 100
          ),
        }))
        .reverse() // Show oldest to newest
    : [];

  if (teamLoading || !teamLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/team/${slug}/check-ins`)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Check-in History</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Participation Trends</span>
              </CardTitle>
              <div className="flex items-center gap-4">
                <Select
                  value={historyDays.toString()}
                  onValueChange={(value) => setHistoryDays(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Tabs value={view} onValueChange={setView} className="h-8">
                  <TabsList className="h-8">
                    <TabsTrigger value="chart" className="h-7 px-3">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="sr-only sm:not-sr-only">Chart</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="h-7 px-3">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="sr-only sm:not-sr-only">List</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No check-in history available.</p>
              </div>
            ) : (
              <Tabs value={view} className="mt-4">
                <TabsContent value="chart" className="mt-0">
                  <div className="h-[300px]">
                    <Bar
                      data={chartData}
                      xField="name"
                      yField="value"
                      tooltip="Check-ins: {value} ({percentage}%)"
                      colors="var(--primary)"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {history.map((day: HistoryItem) => {
                      const percentage = Math.round(
                        (Number(day.check_in_count) / totalMembers) * 100
                      );
                      return (
                        <div
                          key={day.check_in_date}
                          className="flex items-center justify-between p-3 rounded hover:bg-muted"
                          onClick={() =>
                            router.push(
                              `/team/${slug}/check-ins?date=${day.check_in_date}`
                            )
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                percentage >= 75
                                  ? "bg-green-500"
                                  : percentage >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              )}
                            />
                            <span>
                              {format(
                                parseISO(day.check_in_date),
                                "EEEE, MMMM d"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-sm text-muted-foreground">
                              {percentage}% participation
                            </span>
                            <span className="font-medium">
                              {day.check_in_count} / {totalMembers}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
