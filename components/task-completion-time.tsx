"use client";

import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

interface TaskCompletionTimeProps {
  completedAt: string | Date | null;
  className?: string;
  showDate?: boolean;
}

export function TaskCompletionTime({
  completedAt,
  className,
  showDate = true,
}: TaskCompletionTimeProps) {
  if (!completedAt) return null;

  // Parse the timestamp (handle both string and Date objects)
  const timestamp =
    typeof completedAt === "string" ? new Date(completedAt) : completedAt;

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <CalendarClock className="h-3 w-3" />
      <span>
        {showDate
          ? `at ${format(timestamp, "MMM d, h:mm:ss a")}`
          : `at ${format(timestamp, "h:mm:ss a")}`}
      </span>
    </div>
  );
}
