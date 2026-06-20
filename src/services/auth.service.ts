/**
 * Auth adapter (storefront/BE-owned). Mock-first so the whole login/register/account
 * flow is exercisable; swap the bodies for the real BE (Strapi users-permissions or a
 * commerce BE) later — the shapes here are what the UI depends on.
 *
 * B2B is NOT self-registered: business accounts are provisioned in the back office and
 * the customer is given credentials. The storefront only offers PERSONAL registration;
 * both account types log in through the same `login()`.
 */

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

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const mockToken = (id: string) => `mock.${id}.${Date.now().toString(36)}`;

/**
 * Demo accounts (password `123456` for both) so both paths are testable immediately:
 *   - B2C: khachhang@example.com  / 0901234567
 *   - B2B: sales@dacsan.com       / 0987654321  (Doanh nghiệp)
 * NOTE: accounts registered at runtime live in memory only — they survive within the
 * session but not a full reload (the persisted auth store keeps you logged in regardless).
 */
const ACCOUNTS: Array<{ password: string; user: AuthUser }> = [
  {
    password: "123456",
    user: {
      id: "u-personal",
      name: "Nguyễn Văn A",
      email: "khachhang@example.com",
      phone: "0901234567",
      type: "personal",
    },
  },
  {
    password: "123456",
    user: {
      id: "u-business",
      name: "Trần Thị B",
      email: "sales@dacsan.com",
      phone: "0987654321",
      type: "business",
      companyName: "Công ty TNHH Đặc Sản Tây Nguyên",
      taxCode: "0312345678",
    },
  },
];

const matchesIdentifier = (user: AuthUser, id: string) => {
  const v = id.trim().toLowerCase();
  return user.email?.toLowerCase() === v || user.phone === id.trim();
};

export async function login(identifier: string, password: string): Promise<AuthResult> {
  await delay();
  const found = ACCOUNTS.find((a) => matchesIdentifier(a.user, identifier) && a.password === password);
  if (!found) throw new Error("Email/SĐT hoặc mật khẩu không đúng");
  return { token: mockToken(found.user.id), user: found.user };
}

export interface RegisterPersonalInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function registerPersonal(input: RegisterPersonalInput): Promise<AuthResult> {
  await delay();
  const email = input.email.trim().toLowerCase();
  if (ACCOUNTS.some((a) => a.user.email?.toLowerCase() === email)) {
    throw new Error("Email này đã được đăng ký");
  }
  const user: AuthUser = {
    id: "u-" + Date.now().toString(36),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    type: "personal",
  };
  ACCOUNTS.push({ password: input.password, user });
  return { token: mockToken(user.id), user };
}

/** Wholesale (B2B) gate — drives wholesale pricing / VAT invoice (Phase 2). */
export function isWholesale(user: AuthUser | null): boolean {
  return user?.type === "business";
}
