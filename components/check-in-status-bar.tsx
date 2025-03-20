import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { UserList } from "@/components/user-list";
import { toast } from "@/components/ui/use-toast";
import { CheckoutDialog } from "./checkout-dialog";
import { StarRating } from "./star-rating";
import { useSession } from "next-auth/react";
import { UserListCheckIns } from "./user-list-checkins";
import { serverGetCheckInsReturnType } from "@/server/api/routers/check-ins";
interface CheckInStatusBarProps {
  teamId: string;
  totalMembers: number;
  checkIns: serverGetCheckInsReturnType[];
  isLoading: boolean;
}

export function CheckInStatusBar({
  teamId,
  totalMembers,
  checkIns,
  isLoading,
}: CheckInStatusBarProps) {
  const { data: session } = useSession();
  const [showCheckedInUsers, setShowCheckedInUsers] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const checkedInCount = checkIns?.length || 0;
  // const checkedOutCount = checkIns?.filter((c) => c.checkoutAt)?.length || 0;
  const percentage =
    totalMembers > 0 ? Math.round((checkedInCount / totalMembers) * 100) : 0;
  // const checkoutPercentage =
  //   checkedInCount > 0
  //     ? Math.round((checkedOutCount / checkedInCount) * 100)
  //     : 0;

  // // Get current user's check-in
  // const currentUserCheckIn = checkIns?.find(
  //   (c) => c.userId === session?.user?.id
  // );

  return (
    <>
      <Card
        className="hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => setShowCheckedInUsers(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Today's Check-ins</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, MMMM do")}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin ml-auto" />
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {checkedInCount} / {totalMembers}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {percentage}% checked in
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                percentage >= 75
                  ? "bg-green-500"
                  : percentage >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCheckedInUsers} onOpenChange={setShowCheckedInUsers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              <span>Today's Check-ins</span>
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {format(new Date(), "EEEE, MMMM do")}
              </span>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : checkIns && checkIns.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <UserListCheckIns
                checkIns={checkIns}
                onClose={() => setShowCheckedInUsers(false)}
                showTime
                teamId={teamId}
              />
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No team members have checked in today.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckedInUsers(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
