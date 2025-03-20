"use client";

import { redirect } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { api } from "@/lib/trpc/client";

export default function BannedPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const { data: user } = api.users.me.useQuery(undefined, {
    enabled: !!session?.user?.email,
  });

  useEffect(() => {
    if (user && !user.isBanned) {
      redirect("/");
    }
  }, [user]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Banned
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been banned from accessing this application.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            If you believe this is a mistake, please contact your team administrator.
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 