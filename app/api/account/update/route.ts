import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(user.password, currentPassword);

    if (!isValid) {
      return new NextResponse("Invalid current password", { status: 400 });
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);

    await db.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return new NextResponse("Password updated successfully", { status: 200 });
  } catch (error) {
    console.error("[UPDATE_PASSWORD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
