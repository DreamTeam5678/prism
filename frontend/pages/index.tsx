import { signIn, signOut,useSession } from "next-auth/react";
import Welcome from "../components/Welcome/Welcome";

export default function Index() {
  return <Welcome/>
}


