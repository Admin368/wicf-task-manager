"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AccountStats() {
  const { data: joinedTeams, isLoading: isJoinedTeamsLoading } =
    api.teams.getJoinedTeams.useQuery();
  const [stats, setStats] = useState({
    teamsJoined: 0,
    teamsCreated: 0,
  });

  useEffect(() => {
    if (joinedTeams) {
      setStats({
        teamsJoined: joinedTeams.length,
        teamsCreated: joinedTeams.filter((team) =>
          team.members.some((member) => member.role === "admin")
        ).length,
      });
    }
  }, [joinedTeams]);

  if (isJoinedTeamsLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-medium text-muted-foreground">
          Teams Joined
        </div>
        <div className="mt-2 text-2xl font-bold">{stats.teamsJoined}</div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-medium text-muted-foreground">
          Teams Created
        </div>
        <div className="mt-2 text-2xl font-bold">{stats.teamsCreated}</div>
      </div>
    </div>
  );
}
