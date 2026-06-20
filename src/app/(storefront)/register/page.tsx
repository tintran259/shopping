import type { Metadata } from "next";
import { RegisterPage } from "@/features/auth/register-page";

export const metadata: Metadata = { title: "Đăng ký | Shopping" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <RegisterPage />
    </main>
  );
}
