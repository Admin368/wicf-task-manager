"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc/client";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskAssignmentDialogProps {
  taskId: string;
  teamId: string;
  currentAssigneeId?: string;
  teamMembers?: any[];
  taskAssignments?: any[];
  refetchMembers?: () => void;
}

export function TaskAssignmentDialog({
  taskId,
  teamId,
  currentAssigneeId,
  teamMembers: initialTeamMembers,
  taskAssignments,
  refetchMembers,
}: TaskAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    currentAssigneeId
  );
  const [isRemove, setIsRemove] = useState(false);
  // const [teamMembers, setTeamMembers] = useState<any[]>([]);
  // const {
  //   data,
  //   isLoading: isLoadingMembers,
  //   refetch: refetchMembers,
  // } = api.users.getTeamMembers.useQuery({ teamId });
  // const { data: taskAssignments } = api.tasks.getAssignments.useQuery({
  //   taskId,
  // });

  // useEffect(() => {
  //   if (data) {
  //     // if isRemove is true only show users assigned to the task
  //     if (isRemove) {
  //       setTeamMembers(
  //         data?.filter((member: any) =>
  //           taskAssignments?.some((assignment: any) => assignment.userId === member.id)
  //         )
  //       );
  //     } else {
  //       setTeamMembers(data);
  //     }
  //   }
  // }, [data, isRemove]);

  // const utils = api.useContext();

  // if is Remove true only show users assigned to the task, if not only show members not assigned to the task
  const teamMembers = isRemove
    ? initialTeamMembers?.filter((member) =>
        taskAssignments?.some((assignment) => assignment.userId === member.id)
      )
    : initialTeamMembers?.filter(
        (member) =>
          !taskAssignments?.some(
            (assignment) => assignment.userId === member.id
          )
      );

  const assignTask = api.tasks.assign.useMutation({
    onSuccess: () => {
      toast({
        title: "Task assigned",
        description: "The task has been successfully assigned",
      });
      setOpen(false);
      refetchMembers?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
        variant: "destructive",
      });
    },
  });

  const handleAssign = async () => {
    if (!selectedUserId) return;

    try {
      await assignTask.mutateAsync({
        taskId,
        userId: selectedUserId,
        isRemove,
      });
      refetchMembers?.();
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  // const handleRemove = async () => {
  //   if (!selectedUserId) return;

  //   try {
  //     await assignTask.mutateAsync({
  //       taskId,
  //       userId: selectedUserId,
  //       isRemove,
  //     });
  //   } catch (error) {
  //     console.error("Failed to remove task:", error);
  //   }
  // };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {/* <UserPlus className="h-4 w-4 mr-2" /> */}
          Assignment{" "}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Team Member to {isRemove ? "remove" : "assign"} to task
            </label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              // disabled={isLoadingMembers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Remove user Assignment?
              </label>
              <Checkbox
                checked={isRemove}
                onCheckedChange={() => setIsRemove(!isRemove)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || assignTask.isLoading}
            >
              {assignTask.isLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isRemove ? "Remove" : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
