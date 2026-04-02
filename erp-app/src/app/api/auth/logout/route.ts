import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const url = new URL("/erpreview", req.nextUrl.origin);
  const response = NextResponse.redirect(url);
  response.cookies.set("erp_session", "", { maxAge: 0, path: "/" });
  return response;
}
