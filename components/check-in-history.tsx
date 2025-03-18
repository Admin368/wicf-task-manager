import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, TrendingUp } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

// Add a simple chart component to show check-in trends
import { Bar } from "@/components/ui/simple-bar-chart";

interface CheckInHistoryProps {
  teamId: string;
}

export function CheckInHistory({ teamId }: CheckInHistoryProps) {
  const [view, setView] = useState("chart");
  const [historyDays, setHistoryDays] = useState(14);
  
  const { data: history, isLoading } = api.checkIns.getHistory.useQuery({
    teamId,
    limit: historyDays,
  });

  const chartData = history
    ? history
        .slice(0, 14) // Limit to last 14 days for chart view
        .map((day: any) => ({
          name: format(parseISO(day.check_in_date), "MMM d"),
          value: Number(day.check_in_count),
        }))
        .reverse() // Show oldest to newest
    : [];
    
  // Function to get the color based on participation percentage
  const getBarColor = (count: number, maxCount: number) => {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 75) return "var(--green-500)";
    if (percentage >= 50) return "var(--amber-500)";
    return "var(--red-500)";
  };

  const maxCount = chartData.length > 0
    ? Math.max(...chartData.map((d: any) => d.value))
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Check-in History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Check-in History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No check-in history available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Check-in History</span>
          </CardTitle>
          <Tabs
            value={view}
            onValueChange={setView}
            className="h-8"
          >
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
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs value={view} className="mt-0">
          <TabsContent value="chart" className="mt-0">
            <div className="h-[200px]">
              <Bar
                data={chartData}
                xField="name"
                yField="value"
                tooltip="Check-ins: {value}"
                colors="var(--primary)"
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="space-y-1">
              {history?.slice(0, 30).map((day: any) => (
                <div 
                  key={day.check_in_date} 
                  className="flex items-center justify-between p-2 rounded hover:bg-muted"
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 