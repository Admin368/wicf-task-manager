"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => !readOnly && onChange(rating)}
          className={cn(
            "focus:outline-none",
            readOnly && "cursor-default"
          )}
          disabled={readOnly}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              rating <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
} 