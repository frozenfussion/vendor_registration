import { redirect } from "next/navigation";

// The root is not a page in Phase 1; vendors land on /register.
export default function Home() {
  redirect("/register");
}
