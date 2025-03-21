"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/client";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface CloneTeamButtonProps {
  teamId: string;
  teamName: string;
  isCloneable: boolean;
}

export function CloneTeamButton({
  teamId,
  teamName,
  isCloneable,
}: CloneTeamButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState(`${teamName} (Clone)`);
  const [password, setPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cloneTeamMutation = api.teams.cloneTeam.useMutation({
    onSuccess: (team) => {
      toast.success("Team cloned", {
        description: `${team.name} has been created successfully`,
      });
      setIsOpen(false);
      router.push(`/team/${team.slug}`);
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to clone team",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTeamName.trim()) {
      toast.error("Error", {
        description: "Team name is required",
      });
      return;
    }

    if (password.length < 4) {
      toast.error("Error", {
        description: "Password must be at least 4 characters",
      });
      return;
    }

    setIsSubmitting(true);
    await cloneTeamMutation.mutateAsync({
      teamId,
      newTeamName,
      newTeamPassword: password,
      isPrivate,
    });
  };

  if (!isCloneable) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Copy className="mr-2 h-4 w-4" />
          Make own copy of this team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clone Team</DialogTitle>
          <DialogDescription>
            Create a new team with all tasks from {teamName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">New Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password for your team"
                required
                minLength={4}
              />
              <p className="text-xs text-muted-foreground">
                This password will be used by team members to join your team.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="private-mode"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private-mode">Private Team</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Clone
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
