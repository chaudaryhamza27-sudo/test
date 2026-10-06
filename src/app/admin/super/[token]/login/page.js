import { notFound } from "next/navigation";
import SuperAdminLogin from "../../SuperAdminLogin";
import { SUPERADMIN_ROUTE_TOKEN } from "../../superadminRoute";

export default async function SuperAdminLoginRoute({ params }) {
  const { token } = await params;
  let decodedToken;
  try {
    decodedToken = decodeURIComponent(token);
  } catch {
    notFound();
  }
  if (decodedToken !== SUPERADMIN_ROUTE_TOKEN) notFound();

  return <SuperAdminLogin />;
}