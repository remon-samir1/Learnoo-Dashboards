import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("token")?.value;
  const body = await req.text();

  // Check for Authorization header from client (for sessionStorage token flow)
  const clientAuth = req.headers.get("Authorization");
  const authToken = clientAuth?.startsWith("Bearer ")
    ? clientAuth.substring(7)
    : cookieToken || "";

  const apiUrl =  'https://api.learnoo.app';
  const response = await fetch(
    `${apiUrl}/broadcasting/auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
      body,
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}