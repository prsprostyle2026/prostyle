import { logout } from "../login/actions";
import StaffNav from "./StaffNav";

// Top bar on every staff page: section links, who is signed in, and sign out.
export default function StaffBar({ user }: { user: string }) {
  return <StaffNav user={user} logout={logout} />;
}
