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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";

type TeamMember = {
  userId: string;
  role: string | null;
};

type CheckInUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type APITeam = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | null;
  members: TeamMember[];
  checkIns: { user: CheckInUser }[];
};

export function TeamsList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamPassword, setTeamPassword] = useState<Record<string, string>>({});
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedSearchQuery, setJoinedSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [searchFilter, setSearchFilter] = useState<
    "all" | "joined" | "created"
  >("all");
  const { userId, userName, isLoading: isUserLoading } = useUser();

  const { data: allTeams, isLoading: isAllTeamsLoading } =
    api.teams.getAll.useQuery<APITeam[]>();
  const { data: joinedTeams, isLoading: isJoinedTeamsLoading } =
    api.teams.getJoinedTeams.useQuery<APITeam[]>(undefined, {
      enabled: status === "authenticated",
    });

  // Filter teams based on search query and filter type
  const filteredTeams = allTeams?.filter((team: APITeam) => {
    const matchesSearch = team.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isJoined = team.members.some((member) => member.userId === userId);
    const isAdmin = team.members.some(
      (member) => member.userId === userId && member.role === "admin"
    );

    switch (searchFilter) {
      case "joined":
        return matchesSearch && isJoined;
      case "created":
        return matchesSearch && isAdmin;
      default:
        return matchesSearch;
    }
  });

  // Filter joined teams based on search query
  const filteredJoinedTeams = joinedTeams?.filter((team: APITeam) =>
    team.name.toLowerCase().includes(joinedSearchQuery.toLowerCase())
  );

  const joinTeam = api.teams.join.useMutation({
    onSuccess: (data, variables) => {
      const team = allTeams?.find((t: APITeam) => t.id === variables.teamId);
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

  if (
    isAllTeamsLoading ||
    (isJoinedTeamsLoading && status === "authenticated")
  ) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderTeamCard = (team: APITeam) => {
    const isJoined = team.members?.some((member) => member.userId === userId);
    const isAdmin = team.members?.some(
      (member) => member.userId === userId && member.role === "admin"
    );
    const checkedInUsers = team.checkIns?.map((checkIn) => checkIn.user) || [];

    return (
      <Card
        key={team.id}
        className={isJoined ? "border-primary/50 bg-primary/5" : undefined}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>@{team.slug}</CardDescription>
              <CardDescription>
                Created on{" "}
                {team.createdAt
                  ? new Date(team.createdAt).toLocaleDateString()
                  : "N/A"}
              </CardDescription>
            </div>
            {isJoined && (
              <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {isAdmin ? "Owner" : "Joined"}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() =>
              isJoined
                ? router.push(`/team/${team.slug}`)
                : router.push(`/team/${team.slug}/join`)
            }
          >
            {isJoined ? "Enter Team" : "Join Team"}
          </Button>
        </CardContent>
        <CardFooter>
          <div className="space-y-4">
            {checkedInUsers.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Checked in members today: {checkedInUsers.length}
                </div>
                <div className="flex -space-x-2 hidden">
                  {checkedInUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="h-8 w-8 rounded-full border-2 border-background overflow-hidden bg-muted"
                      title={user.name}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-medium">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                  {checkedInUsers.length > 5 && (
                    <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{checkedInUsers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  const renderSearchInput = (
    value: string,
    onChange: (value: string) => void
  ) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search teams by name..."
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
        <Button onClick={handleGoToCreateTeam}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Teams</TabsTrigger>
          <TabsTrigger value="joined">Joined Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="flex flex-col gap-4">
            {renderSearchInput(searchQuery, setSearchQuery)}

            <div className="flex gap-2">
              <Button
                variant={searchFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchFilter("all")}
              >
                All Teams
              </Button>
              <Button
                variant={searchFilter === "joined" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchFilter("joined")}
              >
                Joined Teams
              </Button>
              <Button
                variant={searchFilter === "created" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchFilter("created")}
              >
                My Teams
              </Button>
            </div>
          </div>

          {!filteredTeams?.length ? (
            <div className="text-center p-12 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchFilter === "all"
                  ? "Create a new team or join an existing one."
                  : searchFilter === "joined"
                  ? "You haven't joined any teams yet."
                  : "You haven't created any teams yet."}
              </p>
              <Button onClick={handleGoToCreateTeam}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team) => renderTeamCard(team))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined" className="space-y-4">
          {renderSearchInput(joinedSearchQuery, setJoinedSearchQuery)}

          {!joinedTeams?.length ? (
            <div className="text-center p-12 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-2">No Joined Teams</h3>
              <p className="text-muted-foreground mb-4">
                {`You haven't joined any teams yet. Search for teams to join or
                create your own.`}
              </p>
              <Button onClick={() => setActiveTab("search")}>
                Search Teams
              </Button>
            </div>
          ) : !filteredJoinedTeams?.length ? (
            <div className="text-center p-12 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-2">No Matching Teams</h3>
              <p className="text-muted-foreground mb-4">
                No joined teams match your search query.
              </p>
              <Button
                variant="outline"
                onClick={() => setJoinedSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJoinedTeams.map((team) => renderTeamCard(team))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
