import { NextResponse } from "next/server";
import { searchSuggestions } from "@/services/product.service";

/**
 * Search typeahead endpoint. Keeps the (mock) catalog on the server; the client
 * SearchBar fetches this via React Query. Swap the service body for the BE
 * search API later — the response shape stays the same.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit")) || 6;

  const data = await searchSuggestions(q, limit);
  return NextResponse.json(data);
}
