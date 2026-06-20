"use client";

import type { AuthUser } from "@/services/auth.service";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export function AccountDetails({ user, isWholesale }: { user: AuthUser; isWholesale: boolean }) {
  return (
    <div className="space-y-5">
      {/* Personal info */}
      <Card title="Thông tin cá nhân">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên" value={user.name} />
          <Field label="Loại tài khoản" value={isWholesale ? "Doanh nghiệp" : "Cá nhân"} />
          <Field label="Email" value={user.email} />
          <Field label="Số điện thoại" value={user.phone} />
        </dl>
      </Card>

      {/* Business info (B2B only) */}
      {isWholesale && (
        <Card title="Thông tin doanh nghiệp">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên công ty" value={user.companyName} />
            <Field label="Mã số thuế" value={user.taxCode} />
          </dl>
          <p className="mt-4 rounded-lg bg-(--theme-success,#059669)/10 px-3 py-2 text-xs font-medium text-(--theme-success,#047857)">
            Tài khoản mua sỉ — áp dụng giá doanh nghiệp & xuất hóa đơn VAT.
          </p>
        </Card>
      )}

      {/* Security */}
      <Card title="Bảo mật">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Mật khẩu" value="••••••••" />
          <div>
            <dt className="text-xs text-muted-foreground">Đổi mật khẩu</dt>
            <dd className="mt-0.5 text-sm text-muted-foreground">Sắp có</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
