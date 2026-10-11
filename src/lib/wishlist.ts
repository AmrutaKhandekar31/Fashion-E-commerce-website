import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product_id");
      if (error) throw error;
      return new Set(data.map((d) => d.product_id));
    },
  });
  const ids = q.data ?? new Set<string>();
  const toggle = async (productId: string) => {
    if (!user) { toast("Sign in to save favorites"); return; }
    if (ids.has(productId)) {
      await supabase.from("wishlist_items").delete().eq("product_id", productId).eq("user_id", user.id);
    } else {
      await supabase.from("wishlist_items").insert({ product_id: productId, user_id: user.id });
      toast.success("Saved to wishlist");
    }
    qc.invalidateQueries({ queryKey: ["wishlist", user.id] });
  };
  return { ids, toggle };
}
