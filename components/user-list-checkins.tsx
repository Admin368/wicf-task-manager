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
              className="p-3 rounded-md hover:bg-muted group"
            >
              <div className="flex flex-wrap gap-3">
                {/* Avatar and name - always on first line */}
                <div className="flex items-center gap-2 flex-grow min-w-0 mb-1">
                  <Avatar className="flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {checkIn.user.name}
                      {checkIn.userId === userId && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Me
                        </Badge>
                      )}
                    </div>
                    {checkIn.user.email && (
                      <div className="text-sm text-muted-foreground truncate">
                        {checkIn.user.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Check-in details section */}
                <div className="w-full flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    {showTime && checkIn.checkedInAt && (
                      <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap flex-shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{`Checked in at `}</span>
                        <span>
                          {format(new Date(checkIn.checkedInAt), "h:mm a")}
                        </span>
                      </div>
                    )}
                    {checkIn.checkoutAt && (
                      <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap flex-shrink-0">
                        <LogOut className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">
                          Checked out at{" "}
                        </span>
                        <span>
                          {format(new Date(checkIn.checkoutAt), "h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>

                  {checkIn.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={checkIn.rating} />
                    </div>
                  )}

                  {checkIn.notes && (
                    <div className="text-xs text-muted-foreground mt-1 break-words">
                      {checkIn.notes}
                    </div>
                  )}
                </div>

                {/* Role badge and actions - on bottom line */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:ml-auto mt-2">
                  {checkIn.isBanned && (
                    <Badge variant="destructive" className="flex-shrink-0">
                      Banned
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={`flex items-center whitespace-nowrap flex-shrink-0 ${getRoleColor(
                      checkIn.role
                    )}`}
                  >
                    {getRoleIcon(checkIn.role)}
                    <span className="text-xs">{checkIn.role || "member"}</span>
                  </Badge>

                  {isAdmin && checkIn.userId !== userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCopyId(checkIn.memberId)}
                          className="cursor-pointer"
                        >
                          <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Copy ID</span>
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
                                  <ShieldOff className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Remove Admin</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Make Admin</span>
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
                              {checkIn.isBanned ? (
                                <>
                                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Unban User</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Ban User</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
