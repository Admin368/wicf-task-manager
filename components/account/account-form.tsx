"use client";

import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { useState, useEffect } from "react";
// import { Session } from "next-auth";

const accountFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    // currentPassword: z.string().min(1, "Current password is required"),
    // newPassword: z
    //   .string()
    //   .min(8, "Password must be at least 8 characters")
    //   .optional(),
    // confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
      //   return false;
      // }
      return true;
    },
    {
      message: "New passwords don't match",
      path: ["confirmNewPassword"],
    }
  );

type FormData = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  showPasswordFields?: boolean;
}

export const sessionUpdateTriggerUpdate = async ({
  setIsRefreshing,
  onSuccess,
  triggerReload = false,
}: {
  setIsRefreshing?: (isRefreshing: boolean) => void;
  onSuccess?: (session: any) => void;
  triggerReload?: boolean;
}) => {
  setIsRefreshing?.(true);
  try {
    // Trigger session update to refresh user data
    const csrfRes = await fetch("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        csrfToken,
        data: { trigger: "update" },
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to refresh session");
    }
    toast.success("Permissions refreshed");
    const session = (await res.json()) as any;
    onSuccess?.(session);
    if (triggerReload) {
      window.location.reload();
    } else {
      return res;
    }
  } catch (error) {
    toast.error("Failed to refresh permissions");
    console.error(error);
  } finally {
    setIsRefreshing?.(false);
  }
};

export function AccountForm({ showPasswordFields = true }: AccountFormProps) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      // currentPassword: "",
      // newPassword: "",
      // confirmNewPassword: "",
    },
  });

  // Update form values when session data changes
  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name || "",
        email: session.user.email || "",
        // currentPassword: "",
        // newPassword: "",
        // confirmNewPassword: "",
      });
    }
  }, [session, reset]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/account/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update account");
      }

      const result = await response.json();
      // await update(result);
      sessionUpdateTriggerUpdate({
        setIsRefreshing: setIsLoading,
        triggerReload: true,
        onSuccess: () => {
          toast.success("Account updated successfully");
          setIsEditing(false);
        },
      });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    setIsEditing(false);
    reset({
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      // currentPassword: "",
      // newPassword: "",
      // confirmNewPassword: "",
    });
  }

  useEffect(() => {
    sessionUpdateTriggerUpdate({
      setIsRefreshing: setIsLoading,
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            className="max-w-lg"
            disabled={isLoading || !isEditing}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="max-w-lg"
            disabled={isLoading || !isEditing}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>
      {/* {isEditing && showPasswordFields && (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              className="max-w-lg"
              disabled={isLoading}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              className="max-w-lg"
              disabled={isLoading}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              className="max-w-lg"
              disabled={isLoading}
              {...register("confirmNewPassword")}
            />
            {errors.confirmNewPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>
        </div>
      )} */}
      <div className="flex gap-4">
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
