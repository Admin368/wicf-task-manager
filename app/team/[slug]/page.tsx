"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { api } from "@/lib/trpc/client";
import { Loader2, ExternalLink, Copy, Trash2, Ban } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CheckInButton } from "@/components/check-in-button";
import { CheckInStatusBar } from "@/components/check-in-status-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CheckInsPage from "./check-ins/page";
import { UserList } from "@/components/user-list";
import { useSession } from "next-auth/react";
export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [showUserList, setShowUserList] = useState(false);

  const { data: team, isLoading } = api.teams.getBySlug.useQuery(
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
          if (data.reason === "banned") {
            toast({
              title: "Access Denied",
              description: "You have been banned from this team.",
              variant: "destructive",
            });
          }
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

  // Get team members count for check-in status
  const { data: teamMembers } = api.users.getTeamMembers.useQuery(
    { teamId: team?.id || "" },
    { enabled: !!team?.id && teamLoaded }
  );

  // Get current user's role
  const currentUserRole = teamMembers?.find(
    (member: any) => member.id === userId
  )?.role;

  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";

  const totalMembers = teamMembers?.length || 0;

  const deleteTeam = api.teams.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "The team has been successfully deleted",
      });
      router.push("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !teamLoaded) {
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
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar for check-ins */}
        <div className="space-y-6">
          <CheckInButton teamId={team.id} />
          <CheckInStatusBar teamId={team.id} totalMembers={totalMembers} />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const inviteLink = `${window.location.origin}/team/${slug}/join`;
              const message = `🌟 Maravian Checklist 🌟\nA collaborative task manager with daily check-ins to keep your team in sync!\n\n👋 Join my team "${team.name}" on Maravian Checklist!\n\n📎 Team Link: ${inviteLink}\n🔑 Team Password: ${team.password}\n\nClick the link and use the password to join our team. Let's collaborate together!`;
              navigator.clipboard.writeText(message);
              toast({
                title: "Invite Message Copied",
                description:
                  "Team invite message with password has been copied to your clipboard",
              });
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Invite Message
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/team/${slug}/check-ins`)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Check-in History
          </Button>

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the team and remove all associated data including tasks and
                    check-ins.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTeam.mutate({ teamId: team.id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Main content area */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="checkins">Check Ins</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <TaskList
                teamId={team.id}
                teamName={team.name}
                isAdmin={isAdmin}
              />
            </TabsContent>
            <TabsContent value="checkins">
              <CheckInsPage />
            </TabsContent>
          </Tabs>

          {showUserList && team.id && (
            <UserList
              teamMembers={teamMembers || []}
              onClose={() => setShowUserList(false)}
              teamId={team?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
