"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ShieldCheck,
  User,
  Clock,
  MoreVertical,
  Copy,
  Shield,
  ShieldOff,
  Ban,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useUser } from "./user-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import { StarRating } from "@/components/ui/star-rating";
import { serverGetTeamMembersReturnType } from "@/server/api/routers/users";

// interface TeamMember {
//   id: string;
//   name: string;
//   email: string | null;
//   avatarUrl: string | null;
//   role: string | null;
//   notes?: string | null;
//   checkedInAt?: string | null;
//   isBanned?: boolean;
//   rating?: number | null;
//   checkoutAt?: string | null;
// }

interface UserListProps {
  teamMembers: serverGetTeamMembersReturnType[];
  onClose: () => void;
  showTime?: boolean;
  teamId: string;
  refetch?: () => void;
}

export function UserList({
  teamMembers,
  onClose,
  showTime,
  teamId,
  refetch,
}: UserListProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isAdmin =
    teamMembers.find((member) => member.id === userId)?.role === "admin";
  const updateRole = api.teams.updateMemberRole.useMutation({
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "The member's role has been updated successfully",
      });
      refetch?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const banUser = api.users.banUser.useMutation({
    onSuccess: () => {
      toast({
        title: "User banned",
        description: "The user has been banned from the team",
      });
      refetch?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  const unbanUser = api.users.unbanUser.useMutation({
    onSuccess: () => {
      toast({
        title: "User unbanned",
        description: "The user has been unbanned from the team",
      });
      refetch?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    },
  });

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied",
      description: "User ID copied to clipboard",
    });
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: "member" | "admin"
  ) => {
    if (!teamId) return;

    try {
      await updateRole.mutateAsync({
        teamId,
        userId: memberId,
        role: newRole,
      });
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleBanUser = async (memberId: string) => {
    if (!teamId) return;

    try {
      await banUser.mutateAsync({
        teamId,
        userId: memberId,
      });
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnbanUser = async (memberId: string) => {
    if (!teamId) return;

    try {
      await unbanUser.mutateAsync({
        teamId,
        userId: memberId,
      });
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const getRoleColor = (role: string | null) => {
    if (!role) return "bg-secondary text-secondary-foreground";
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-primary text-primary-foreground";
      case "owner":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getRoleIcon = (role: string | null) => {
    if (!role) return <User className="h-3 w-3 mr-1" />;
    switch (role.toLowerCase()) {
      case "admin":
      case "owner":
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      default:
        return <User className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>
            {showTime ? "Checked-in Members" : "Team Members"}
          </CardTitle>
          <CardDescription>{isAdmin ? "Admin" : "Member"}</CardDescription>
          <CardDescription>
            {teamMembers.length}{" "}
            {teamMembers.length === 1 ? "member" : "members"}{" "}
            {showTime ? "checked in" : "in the team"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted group"
            >
              <Avatar>
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} />
                ) : (
                  <AvatarFallback>
                    {member.name
                      ? member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "?"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {member.name}
                  {member.id === userId && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Me
                    </Badge>
                  )}
                </div>
                {member.email && (
                  <div className="text-sm text-muted-foreground">
                    {member.email}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {member.isBanned && <Badge variant="destructive">Banned</Badge>}
                <Badge
                  variant="secondary"
                  className={`flex items-center ${getRoleColor(member.role)}`}
                >
                  {getRoleIcon(member.role)}
                  {member.role || "Member"}
                </Badge>
                {isAdmin && member.id !== userId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCopyId(member.id)}
                        className="cursor-pointer"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                      </DropdownMenuItem>
                      {member.role !== "owner" && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(
                                member.id,
                                member.role === "admin" ? "member" : "admin"
                              )
                            }
                            className="cursor-pointer"
                          >
                            {member.role === "admin" ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              member.isBanned
                                ? handleUnbanUser(member.id)
                                : handleBanUser(member.id)
                            }
                            className="cursor-pointer"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {member.isBanned ? "Unban User" : "Ban User"}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
