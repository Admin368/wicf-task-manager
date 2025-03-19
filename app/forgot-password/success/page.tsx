import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="mt-2 text-3xl font-bold text-white-900">
            Check your email
          </h2>
          <p className="mt-4 text-gray-600">
            If an account exists with the email you provided, you&apos;ll
            receive a password reset link shortly.
          </p>
        </div>
        <div className="mt-6">
          <Link href="/login">
            <Button className="w-full">Return to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
