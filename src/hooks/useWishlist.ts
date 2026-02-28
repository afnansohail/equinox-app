import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWishlist,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";

export function useWishlist() {
  const user = useAuthStore((state) => state.user);

  return useQuery<WishlistItem[]>({
    queryKey: ["wishlist", user?.id],
    queryFn: () => getWishlist(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useIsInWishlist(symbol: string) {
  const user = useAuthStore((state) => state.user);

  return useQuery<boolean>({
    queryKey: ["wishlist", user?.id, symbol],
    queryFn: () => isInWishlist(user!.id, symbol),
    enabled: !!user?.id && !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleWishlist() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      symbol,
      isCurrentlyInWishlist,
    }: {
      symbol: string;
      isCurrentlyInWishlist: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (isCurrentlyInWishlist) {
        return removeFromWishlist(user.id, symbol);
      } else {
        return addToWishlist(user.id, symbol);
      }
    },
    onSuccess: (_, { symbol }) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({
        queryKey: ["wishlist", user?.id, symbol],
      });
    },
  });
}
