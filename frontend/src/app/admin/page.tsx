import AppShell from "@/components/AppShell";
import RolePage from "@/components/RolePage";
import AdminSupply from "@/components/dashboards/AdminSupply";

export default function AdminPage() {
  return <AppShell><RolePage allowed={["ADMIN", "CENTRAL_BANK_ADMIN"]}><AdminSupply /></RolePage></AppShell>;
}
