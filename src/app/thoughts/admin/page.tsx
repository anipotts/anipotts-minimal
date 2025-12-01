import { checkAuth } from "../actions";
import AdminInterface from "./AdminInterface";
import LoginForm from "./LoginForm";

export default async function AdminPage() {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <AdminInterface />;
}
