import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
});

export const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"] as const;

export const USD_TO_INR = 88;

// Prices are stored in USD; display them in rupees with Indian digit grouping.
export const formatPrice = (n: number) => `₹${Math.round(Number(n) * USD_TO_INR).toLocaleString("en-IN")}`;
