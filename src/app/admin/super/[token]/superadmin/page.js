import { notFound } from "next/navigation";
import "../../../admin.css";
import AdminDashboard from "../../../page";
import { SUPERADMIN_ROUTE_TOKEN } from "../../superadminRoute";

export default async function SuperadminPage({ params }) {
  const { token } = await params;
  let decodedToken;
  try {
    decodedToken = decodeURIComponent(token);
  } catch {
    notFound();
  }
  if (decodedToken !== SUPERADMIN_ROUTE_TOKEN) notFound();

  return <AdminDashboard superadminMode />;
}