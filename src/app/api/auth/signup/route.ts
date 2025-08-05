// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // Check if username exists
    const userCheck = await pool.query(
      "SELECT id FROM auth WHERE username = $1",
      [username]
    );
    if (userCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    await pool.query(
      "INSERT INTO auth (username, password_hash) VALUES ($1, $2)",
      [username, hashedPassword]
    );

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Signup failed" }, { status: 500 });
  }
}
