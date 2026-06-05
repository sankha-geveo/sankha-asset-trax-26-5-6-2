import { useCallback, useRef, useState } from 'react';

export function useCursorPagination<T>(fetcher: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const working = useRef(false);

  const loadMore = useCallback(async () => {
    if (working.current || !hasMore) return;
    working.current = true; setLoading(true);
    try {
      const { items: chunk, nextCursor } = await fetcher(cursor);
      setItems(prev => [...prev, ...chunk]);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } finally {
      setLoading(false); working.current = false;
    }
  }, [cursor, hasMore, fetcher]);

  const reset = useCallback(async () => {
    setItems([]); setCursor(null); setHasMore(true);
  }, []);

  return { items, hasMore, loading, loadMore, reset };
}
