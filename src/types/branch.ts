/**
 * A physical store / fulfillment branch. The selected branch scopes
 * stock, price, pickup and delivery across the storefront — see
 * [src/store/branch.store.ts](src/store/branch.store.ts).
 */
export interface Branch {
  id: string;
  name: string;
  /** Full street address, shown in the picker. */
  address: string;
  /** City / province — used to group branches in the modal. */
  city: string;
  /** Province code (administrative API) — used to detect intra-province shipping. */
  provinceCode?: string;
  phone: string | null;
  /** Pre-selected when the visitor has not chosen one yet. */
  isDefault: boolean;
}
