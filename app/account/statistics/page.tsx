import { Metadata } from "next";
import { AccountStats } from "@/components/account/account-stats";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCircle, LineChart, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Account Statistics",
  description: "View your account statistics",
};

export default function StatisticsPage() {
  return (
    <div className="grid grid-cols-[240px_1fr] h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="border-r bg-muted/40">
        <div className="flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/account">
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 bg-accent"
              asChild
            >
              <Link href="/account/statistics">
                <LineChart className="h-4 w-4" />
                Statistics
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/account/security">
                <Lock className="h-4 w-4" />
                Security
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-2xl">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-bold">Account Statistics</h1>
              <p className="text-muted-foreground">
                View your activity and team statistics
              </p>
            </div>
            <AccountStats />
          </div>
        </div>
      </div>
    </div>
  );
}
