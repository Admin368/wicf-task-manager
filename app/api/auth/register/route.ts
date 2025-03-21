import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EmailService } from "@/lib/email";
import { env } from "@/lib/env";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Send welcome email
    const loginUrl = `${env.NEXT_PUBLIC_APP_URL}/login`;
    await EmailService.sendWelcomeEmail(email, {
      name: user.name,
      loginUrl,
    });

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
