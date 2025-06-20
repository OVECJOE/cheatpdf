import { useState, useRef, useCallback } from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: string;
}

export function useChatPagination({
  chatId,
  pageSize = 10,
}: {
  chatId: string;
  pageSize?: number;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [windowStart, setWindowStart] = useState(0); // index of first message in window
  const totalCount = useRef<number>(0);

  // Fetch a window of messages
  const fetchWindow = useCallback(async (start: number) => {
    setLoading(true);
    try {
      // Try paginated API, fallback to full fetch
      const res = await fetch(`/api/chats/${chatId}?offset=${start}&limit=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        totalCount.current = data.totalCount || (start + data.messages.length);
        setHasPrev(start > 0);
        setHasNext(start + pageSize < totalCount.current);
        setWindowStart(start);
      } else {
        // fallback: fetch all and slice
        const res2 = await fetch(`/api/chats/${chatId}`);
        if (res2.ok) {
          const data = await res2.json();
          const all = data.chat.messages;
          totalCount.current = all.length;
          const window = all.slice(Math.max(0, all.length - pageSize - start), all.length - start);
          setMessages(window);
          setHasPrev(all.length - pageSize - start > 0);
          setHasNext(start > 0);
          setWindowStart(start);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, pageSize]);

  // Initial load
  const initialized = useRef(false);
  const init = useCallback(() => {
    if (!initialized.current) {
      fetchWindow(0);
      initialized.current = true;
    }
  }, [fetchWindow]);

  // Navigation
  const loadPrev = useCallback(() => {
    if (hasPrev) fetchWindow(windowStart + pageSize);
  }, [hasPrev, windowStart, pageSize, fetchWindow]);
  const loadNext = useCallback(() => {
    if (hasNext) fetchWindow(Math.max(0, windowStart - pageSize));
  }, [hasNext, windowStart, pageSize, fetchWindow]);
  const jumpToLatest = useCallback(() => {
    fetchWindow(0);
  }, [fetchWindow]);

  // Refetch (e.g., after sending a message)
  const refetch = useCallback(() => {
    fetchWindow(windowStart);
  }, [fetchWindow, windowStart]);

  return {
    messages,
    loading,
    hasPrev,
    hasNext,
    loadPrev,
    loadNext,
    jumpToLatest,
    refetch,
    init,
    windowStart,
    pageSize,
    totalCount: totalCount.current,
  };
} 