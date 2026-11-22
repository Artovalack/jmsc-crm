import { redirect } from "next/navigation";
import SetupNotice from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default function HomePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  redirect("/dashboard");
}
