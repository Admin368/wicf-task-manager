"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc/client";
import { Loader2, Lock, Plus, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "./user-provider";

type APITeam = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | null;
};

export function TeamsList() {
  const router = useRouter();
  const [teamPassword, setTeamPassword] = useState<Record<string, string>>({});
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { userId, userName, isLoading: isUserLoading } = useUser();

  const { data: teams, isLoading } = api.teams.getAll.useQuery();

  // Filter teams based on search query
  const filteredTeams = teams?.filter((team: APITeam) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinTeam = api.teams.join.useMutation({
    onSuccess: (data, variables) => {
      const team = teams?.find((t: APITeam) => t.id === variables.teamId);
      if (team) {
        toast({
          title: "Team joined",
          description: `You have successfully joined ${team.name}`,
        });
        router.push(`/team/${team.slug}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive",
      });
    },
  });

  const handleJoinTeam = async (team: APITeam) => {
    try {
      setJoiningTeam(team.id);
      await joinTeam.mutateAsync({
        teamId: team.id,
        password: teamPassword[team.id] || "",
      });
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setJoiningTeam(null);
      setTeamPassword((prev) => ({ ...prev, [team.id]: "" }));
    }
  };

  const handleGoToCreateTeam = () => {
    router.push("/create-team");
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.reload();
    // router.push("/")
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
        <Button onClick={handleGoToCreateTeam}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
        {/* {userId && <Button onClick={handleLogout}>Logout</Button>} */}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search teams by name..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {!filteredTeams || filteredTeams.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          {teams?.length === 0 ? (
            <>
              <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-4">
                Create a new team or join an existing one.
              </p>
              <Button onClick={handleGoToCreateTeam}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">No Matching Teams</h3>
              <p className="text-muted-foreground mb-4">
                No teams match your search query.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team: APITeam) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>@{team.slug}</CardDescription>
                <CardDescription>
                  Created on{" "}
                  {team.createdAt
                    ? new Date(team.createdAt).toLocaleDateString()
                    : "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Password protected</span>
                </div>
                <Input
                  type="password"
                  placeholder="Enter team password"
                  value={teamPassword[team.id] || ""}
                  onChange={(e) =>
                    setTeamPassword((prev) => ({
                      ...prev,
                      [team.id]: e.target.value,
                    }))
                  }
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleJoinTeam(team)}
                  disabled={joiningTeam === team.id || !teamPassword[team.id]}
                >
                  {joiningTeam === team.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Team"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
