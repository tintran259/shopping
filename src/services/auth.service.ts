import { env } from "@/config/env";

/**
 * Auth adapter → commerce BE (shopping-api): `POST /auth/register|login`,
 * `GET /auth/me`. B2C self-registers; B2B is provisioned in the back office and
 * logs in through the same `login()`. The BE customer shape is mapped to the
 * storefront `AuthUser` here.
 */
const API = env.apiUrl;

export type AccountType = "personal" | "business";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: AccountType;
  /** Business-only profile (provisioned in the back office). */
  companyName?: string;
  taxCode?: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface RegisterPersonalInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface ApiCustomer {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  type?: string;
  b2bProfile?: { companyName?: string; taxCode?: string } | null;
}

function mapUser(c: ApiCustomer): AuthUser {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return {
    id: c.id,
    name: name || c.email || "Khách hàng",
    email: c.email ?? null,
    phone: c.phone ?? null,
    type: c.type === "b2b" ? "business" : "personal",
    companyName: c.b2bProfile?.companyName,
    taxCode: c.b2bProfile?.taxCode,
  };
}

/** Full current user (with phone + b2b profile) for an access token. */
async function me(token: string): Promise<AuthUser | null> {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return mapUser((await res.json()) as ApiCustomer);
}

/** BE login is by email; the storefront passes the identifier as email. */
export async function login(identifier: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: identifier.trim(), password }),
  });
  if (!res.ok) throw new Error("Email/SĐT hoặc mật khẩu không đúng");
  const data = (await res.json()) as { accessToken: string; user: ApiCustomer };
  const user = (await me(data.accessToken)) ?? mapUser(data.user);
  return { token: data.accessToken, user };
}

export async function registerPersonal(input: RegisterPersonalInput): Promise<AuthResult> {
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      phone: input.phone?.trim() || undefined,
    }),
  });
  if (res.status === 409) throw new Error("Email này đã được đăng ký");
  if (!res.ok) throw new Error("Đăng ký thất bại, vui lòng thử lại");
  const data = (await res.json()) as { accessToken: string; user: ApiCustomer };
  const user = (await me(data.accessToken)) ?? mapUser(data.user);
  return { token: data.accessToken, user };
}

/** Wholesale (B2B) gate — drives wholesale pricing / VAT invoice. */
export function isWholesale(user: AuthUser | null): boolean {
  return user?.type === "business";
}
