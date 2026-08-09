import { getCurrentUser } from "../../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }
  return Response.json({
    user: {
      uid: user.uid,
      phone: user.phone,
      email: user.email,
      balance: user.balance,
      role: user.role,
      inviteCode: user.inviteCode,
    },
  });
}
