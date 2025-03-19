import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc/client";

interface CheckInButtonProps {
  teamId: string;
}

export function CheckInButton({ teamId }: CheckInButtonProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  // Get the user's check-in status for today
  const {
    data: checkInStatus,
    isLoading: checkingStatus,
    refetch: refetchStatus,
  } = api.checkIns.getUserCheckInStatus.useQuery(
    {
      teamId,
      date: today,
    },
    {
      enabled: !!teamId, // Only run query when teamId exists
      retry: false, // Don't retry on error
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to get check-in status. Please refresh the page.",
          variant: "destructive",
        });
      },
    }
  );

  // Mutation for checking in
  const { mutate: checkIn, isLoading: isCheckingIn } =
    api.checkIns.checkIn.useMutation({
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: "Checked in successfully",
            description: "You've been marked as present for today.",
          });
        } else {
          toast({
            title: "Checked in successfully",
            description: "You've been marked as present for today.",
          });
        }
        setOpen(false);
        setNotes("");
        refetchStatus();
        router.refresh();
      },
      onError: (error) => {
        toast({
          title: "Check-in failed",
          description: error.message || "Failed to check in. Please try again.",
          variant: "destructive",
        });
      },
    });

  const handleCheckIn = () => {
    checkIn({
      teamId,
      date: today,
      notes: notes.trim(),
    });
  };

  const isLoading = checkingStatus || isCheckingIn;
  const hasCheckedIn = checkInStatus?.checkedIn;

  return (
    <>
      <Button
        className="w-full h-16 text-lg font-semibold"
        size="lg"
        id="check-in-button"
        onClick={() => setOpen(true)}
        disabled={isLoading || hasCheckedIn}
        variant={hasCheckedIn ? "outline" : "default"}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : hasCheckedIn ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
            <span>Already Checked In Today</span>
          </>
        ) : (
          <span>{`I have Arrived (Check In)`}</span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Daily Check-In</DialogTitle>
            <DialogDescription>
              Confirm your presence for today,{" "}
              {format(new Date(), "EEEE, MMMM do, yyyy")}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Notes (optional)</p>
              <Textarea
                placeholder="Add any notes about your day..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleCheckIn} disabled={isCheckingIn}>
              {isCheckingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking in...
                </>
              ) : (
                "Confirm Check-In"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
