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
import { toast } from "@/components/ui/use-toast";
import { StarRating } from "./star-rating";

interface CheckoutDialogProps {
  teamId: string;
  userId?: string;
  isDisabled?: boolean;
}

export function CheckoutDialog({
  teamId,
  userId,
  isDisabled = false,
}: CheckoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  // const utils = api.useContext();

  const checkout = api.checkIns.checkout.useMutation({
    onSuccess: () => {
      toast({
        title: "Checked out successfully",
        description: "Your daily checkout has been recorded",
      });
      setOpen(false);
      // utils.checkIns.getByTeam.invalidate({ teamId });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to checkout",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please rate your day before checking out",
        variant: "destructive",
      });
      return;
    }

    try {
      await checkout.mutateAsync({
        checkInId: userId || "",
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
          disabled={isDisabled}
        >
          <LogOut className="h-4 w-4 mr-2 text-green-500" />
          Done for the Day (Checkout)
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
