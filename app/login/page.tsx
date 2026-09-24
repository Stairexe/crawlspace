import type { Metadata } from "next";
import { AuthPending } from "@/components/AuthPending";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <AuthPending mode="signin" />;
}
