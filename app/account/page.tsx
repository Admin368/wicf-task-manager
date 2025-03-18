import { Metadata } from "next";
import { AccountForm } from "@/components/account/account-form";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account settings",
};

export default function AccountPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <AccountForm />
      </div>
    </div>
  );
}
