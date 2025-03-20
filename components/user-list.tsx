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

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string | null;
  notes?: string | null;
  checkedInAt?: string | null;
}

interface UserListProps {
  teamMembers: TeamMember[];
  onClose: () => void;
  showTime?: boolean;
  teamId: string;
}

export function UserList({
  teamMembers,
  onClose,
  showTime,
  teamId,
}: UserListProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isAdmin = teamMembers.find((member) => member.id === userId)?.role === "admin";
  const updateRole = api.teams.updateMemberRole.useMutation({
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "The member's role has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
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
          <CardDescription>
            {isAdmin ? "Admin" : "Member"}
          </CardDescription>
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
                <Badge
                  variant="secondary"
                  className={`flex items-center ${getRoleColor(member.role)}`}
                >
                  {getRoleIcon(member.role)}
                  {member.role
                    ? member.role.charAt(0).toUpperCase() +
                      member.role.slice(1)
                    : "Member"}
                </Badge>

                {isAdmin && teamId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyId(member.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                      </DropdownMenuItem>

                      {isAdmin && member.role !== "owner" && (
                        member.role === "admin" ? (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "member")}
                            className="text-destructive"
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Remove Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "admin")}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                        )
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
