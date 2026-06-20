"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

export function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, status, error, login, clearError, mounted } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (mounted && isAuthenticated) router.replace("/account");
  }, [mounted, isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    const ok = await login(identifier, password);
    if (ok) router.push("/account");
  };

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <h1 className="text-2xl font-bold tracking-tight text-(--theme-heading-color,inherit)">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để theo dõi đơn hàng và mua sắm nhanh hơn.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Email hoặc số điện thoại</label>
          <input
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) clearError();
            }}
            placeholder="email@example.com / 09xx xxx xxx"
            className={inputCls}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder="••••••"
            className={inputCls}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-(--theme-out-of-stock,var(--destructive))">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={status === "loading" || !identifier.trim() || !password}
        >
          {status === "loading" ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Đăng ký
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Tài khoản demo (mật khẩu: 123456)</p>
        <p className="mt-1">Cá nhân: khachhang@example.com</p>
        <p>Doanh nghiệp: sales@dacsan.com</p>
        <p className="mt-2">
          Doanh nghiệp (B2B) được cấp tài khoản từ chúng tôi — vui lòng liên hệ để đăng ký mua sỉ.
        </p>
      </div>
    </div>
  );
}
