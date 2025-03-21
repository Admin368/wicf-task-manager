"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc/client";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "./star-rating";
import { serverGetCheckInsReturnType } from "@/server/api/routers/check-ins";

interface CheckoutDialogProps {
  // teamId: string;
  // userId?: string;
  // checkInId: string;
  isDisabled?: boolean;
  checkInData?: serverGetCheckInsReturnType;
  refetch: () => void;
}

export function CheckoutDialog({
  // teamId,
  // userId,
  isDisabled = false,
  checkInData,
  refetch,
}: CheckoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(checkInData?.rating || 0);
  const [notes, setNotes] = useState(checkInData?.notes || "");

  // const utils = api.useContext();

  const checkout = api.checkIns.checkout.useMutation({
    onSuccess: () => {
      toast.success("Checked out successfully", {
        description: "Your daily checkout has been recorded",
      });
      setOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to checkout", {
        description: error.message || "Failed to checkout",
      });
    },
  });

  const handleCheckout = async () => {
    if (rating === 0) {
      toast.error("Rating required", {
        description: "Please rate your day before checking out",
      });
      return;
    }

    try {
      if (!checkInData?.id) {
        toast.error("Check-in ID not found", {
          description: "Please try again",
        });
        return;
      }
      await checkout.mutateAsync({
        checkInId: checkInData?.id,
        rating,
        notes,
      });
    } catch (error) {
      console.error("Failed to checkout:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full h-16 text-lg font-semibold"
          size="lg"
          variant="default"
          disabled={isDisabled || !!checkInData?.checkoutAt}
        >
          <LogOut className="h-4 w-4 mr-2 text-green-500" />
          {checkInData?.checkoutAt
            ? `Already Checked Out ✅`
            : `Done for the Day (Checkout)`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Checkout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate Your Day</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes for the Day</label>
            <Textarea
              placeholder="How was your day? What did you accomplish?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="w-full h-16 text-lg font-semibold"
              size="lg"
              id="check-in-button"
              onClick={handleCheckout}
              disabled={checkout.isLoading}
            >
              {checkout.isLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
