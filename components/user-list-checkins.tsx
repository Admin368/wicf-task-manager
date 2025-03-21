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
import { toast } from "sonner";
import { api } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import { StarRating } from "@/components/ui/star-rating";
import { serverGetCheckInsReturnType } from "@/server/api/routers/check-ins";

interface UserListProps {
  checkIns: serverGetCheckInsReturnType[];
  onClose: () => void;
  showTime?: boolean;
  teamId: string;
  refetch?: () => void;
}

export function UserListCheckIns({
  checkIns,
  onClose,
  showTime,
  teamId,
  refetch,
}: UserListProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isAdmin =
    checkIns.find((checkIn) => checkIn.userId === userId)?.role === "admin";
  const updateRole = api.teams.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated", {
        description: "The member's role has been updated successfully",
      });
      refetch?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to update role",
      });
    },
  });

  const banUser = api.users.banUser.useMutation({
    onSuccess: () => {
      toast.success("User banned", {
        description: "The user has been banned from the team",
      });
      refetch?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to ban user",
      });
    },
  });

  const unbanUser = api.users.unbanUser.useMutation({
    onSuccess: () => {
      toast.success("User unbanned", {
        description: "The user has been unbanned from the team",
      });
      refetch?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to unban user",
      });
    },
  });

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Copied", {
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
            {checkIns.length} {checkIns.length === 1 ? "member" : "members"}{" "}
            {showTime ? "checked in" : "in the team"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {checkIns.map((checkIn) => (
            <div
              key={checkIn.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted group"
            >
              <Avatar>
                {checkIn.user.avatarUrl ? (
                  <img
                    src={checkIn.user.avatarUrl}
                    alt={checkIn.user.name ?? "User Avatar"}
                  />
                ) : (
                  <AvatarFallback>
                    {checkIn.user.name
                      ? checkIn.user.name
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
                  {checkIn.user.name}
                  {checkIn.userId === userId && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Me
                    </Badge>
                  )}
                </div>
                {checkIn.user.email && (
                  <div className="text-sm text-muted-foreground">
                    {checkIn.user.email}
                  </div>
                )}
                {showTime && checkIn.checkedInAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Checked in at{" "}
                    {format(new Date(checkIn.checkedInAt), "h:mm a")}
                  </div>
                )}
                {checkIn.checkoutAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <LogOut className="h-3 w-3" />
                    Checked out at{" "}
                    {format(new Date(checkIn.checkoutAt), "h:mm a")}
                  </div>
                )}
                {checkIn.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <StarRating rating={checkIn.rating} />
                  </div>
                )}
                {checkIn.notes && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {checkIn.notes}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* {checkIn.isBanned && (
                  <Badge variant="destructive">
                    Banned
                  </Badge>
                )} */}
                <Badge
                  variant="secondary"
                  className={`flex items-center ${getRoleColor(checkIn.role)}`}
                >
                  {getRoleIcon(checkIn.role)}
                  {checkIn.role || "Member"}
                </Badge>
                {isAdmin && checkIn.userId !== userId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCopyId(checkIn.memberId)}
                        className="cursor-pointer"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                      </DropdownMenuItem>
                      {checkIn.role !== "owner" && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(
                                checkIn.memberId,
                                checkIn.role === "admin" ? "member" : "admin"
                              )
                            }
                            className="cursor-pointer"
                          >
                            {checkIn.role === "admin" ? (
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
                              checkIn.isBanned
                                ? handleUnbanUser(checkIn.memberId)
                                : handleBanUser(checkIn.memberId)
                            }
                            className="cursor-pointer"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {checkIn.isBanned ? "Unban User" : "Ban User"}
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
