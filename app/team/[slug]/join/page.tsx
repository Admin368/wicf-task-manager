"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Loader2, Lock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function JoinTeamPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const {
    data: teamData,
    isLoading,
    error,
  } = api.teams.getBySlug.useQuery(
    { slug },
    {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Team not found.",
          variant: "destructive",
        });
        router.push("/");
      },
    }
  );
  const { team, teamMembers } = teamData || {};

  const joinTeam = api.teams.join.useMutation({
    onSuccess: () => {
      toast({
        title: "Team joined",
        description: `You have successfully joined ${team?.name}`,
      });
      router.push(`/team/${slug}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive",
      });
      setIsJoining(false);
    },
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    try {
      setIsJoining(true);
      await joinTeam.mutateAsync({
        teamId: team.id,
        password,
      });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join {team.name}</CardTitle>
          <CardDescription>
            Enter the password to join {team.name}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleJoin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center mb-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
              </div>
              <Input
                type="password"
                placeholder="Enter team password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isJoining || !password}>
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Team"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
