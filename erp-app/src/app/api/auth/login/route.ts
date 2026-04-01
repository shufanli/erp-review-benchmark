import { NextRequest, NextResponse } from "next/server";
import { verifyLogin, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
  }

  const user = verifyLogin(username, password);
  if (!user) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const token = createSessionToken(user.id);
  const response = NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } });
  response.cookies.set("erp_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
