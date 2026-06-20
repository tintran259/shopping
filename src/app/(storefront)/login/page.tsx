import type { Metadata } from "next";
import { LoginPage } from "@/features/auth/login-page";

export const metadata: Metadata = { title: "Đăng nhập | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <LoginPage />
    </main>
  );
}
