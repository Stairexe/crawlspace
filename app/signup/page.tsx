import type { Metadata } from "next";
import { AuthPending } from "@/components/AuthPending";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return <AuthPending mode="signup" />;
}
