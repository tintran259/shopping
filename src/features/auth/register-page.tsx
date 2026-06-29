"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

export function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, status, error, register, clearError, mounted } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && isAuthenticated) router.replace("/account");
  }, [mounted, isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!name.trim() || !email.trim() || !password) return;
    if (password.length < 8) {
      setLocalError("Mật khẩu cần tối thiểu 8 ký tự.");
      return;
    }
    if (password !== confirm) {
      setLocalError("Mật khẩu nhập lại không khớp.");
      return;
    }
    const ok = await register({ name, email, phone, password });
    if (ok) router.push("/account");
  };

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <h1 className="text-2xl font-bold tracking-tight text-(--theme-heading-color,inherit)">Đăng ký</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản cá nhân để mua sắm nhanh hơn.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Họ và tên</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="email@example.com"
            className={inputCls}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Số điện thoại (tùy chọn)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            className={inputCls}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nhập lại mật khẩu</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••"
            className={inputCls}
            autoComplete="new-password"
          />
        </div>

        {(localError || error) && (
          <p className="text-sm text-(--theme-out-of-stock,var(--destructive))">{localError ?? error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={status === "loading" || !name.trim() || !email.trim() || !password}
        >
          {status === "loading" ? "Đang tạo tài khoản…" : "Đăng ký"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>

      <p className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
        Mua sỉ / doanh nghiệp (B2B)? Tài khoản do chúng tôi cấp — vui lòng liên hệ để được hỗ trợ.
      </p>
    </div>
  );
}
