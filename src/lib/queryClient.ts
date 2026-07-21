import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";

export const queryClient = new QueryClient();

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// Bump this whenever a persisted query's shape changes, so cache from an
// older build is discarded cleanly instead of rehydrating a stale shape.
const PERSIST_CACHE_BUSTER = "v1";

// Only these queries are worth restoring instantly on cold start — they're
// small, user-scoped, and staleTime: Infinity already means they only change
// via explicit invalidation. Live prices and scraped payouts are cheap to
// refetch and are deliberately left out so they don't bloat AsyncStorage.
const PERSISTED_QUERY_KEYS = new Set([
  "portfolio",
  "transactions",
  "portfolioHistory",
  "dividends",
  "wishlist",
]);

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  buster: PERSIST_CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      PERSISTED_QUERY_KEYS.has(query.queryKey[0] as string),
  },
};
