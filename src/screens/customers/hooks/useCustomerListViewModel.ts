import { useCallback, useEffect, useState } from "react";
import { CustomerRepositoryImpl } from "../../../features/shared/services/repositories/customer.repo.impl";
import { fetchSavingsCustomers } from "../../../features/shared/services/usecases/fetchSavingsCustomers";
import { searchSavingsCustomers } from "../../../features/shared/services/usecases/searchSavingsCustomers";
import { fetchLoans } from "../../../features/shared/services/usecases/fetchLoans";
import { searchCreditCustomers } from "../../../features/shared/services/usecases/searchCreditCustomers";
import type { NplData } from "../../../features/shared/types/npl";

type Mode = "tabungan" | "kredit";
const repo = new CustomerRepositoryImpl();

export const useCustomerListViewModel = () => {
  const [mode, setMode] = useState<Mode>("tabungan");
  const [query, setQuery] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [collectibility, setCollectibility] = useState<string[]>([]);
  const [maxCollect, setMaxCollect] = useState(5);
  const [npl, setNpl] = useState<NplData>({ amount: 0, percentage: 0 });

  useEffect(() => { setMaxCollect(5); }, []);

  const formatIDR = useCallback((x?: number) =>
    (x ?? 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }), []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setList([]);
    setOffset(0);
    setHasMore(true);
    try {
      if (mode === "kredit") {
        const { customers, npl } = await fetchLoans(repo)({ collectibility });
        setList(customers);
        setNpl(npl);
        setHasMore(false);
      } else {
        const data = await fetchSavingsCustomers(repo)(0, 100);
        setList(data);
        setHasMore(data.length === 100);
        setOffset(100);
        setNpl({ amount: 0, percentage: 0 });
      }
    } finally { setLoading(false); }
  }, [mode, collectibility]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || mode === "kredit") return;
    setLoading(true);
    try {
      const data = await fetchSavingsCustomers(repo)(offset, 100);
      setList(prev => [...prev, ...data]);
      setHasMore(data.length === 100);
      setOffset(prev => prev + 100);
    } finally { setLoading(false); }
  }, [loading, hasMore, offset, mode]);

  const search = useCallback(async () => {
    if (!query.trim()) return loadInitial();
    setLoading(true);
    try {
      if (mode === "kredit") {
        const { customers, npl } = await searchCreditCustomers(repo)(query.trim(), { collectibility });
        setList(customers);
        setNpl(npl);
        setHasMore(false);
      } else {
        const data = await searchSavingsCustomers(repo)(query.trim());
        setList(data);
        setHasMore(false);
      }
    } finally { setLoading(false); }
  }, [query, mode, collectibility, loadInitial]);

  useEffect(() => { loadInitial(); }, [loadInitial]);
  useEffect(() => { if (mode === "kredit") search(); }, [collectibility]);

  return {
    mode, setMode,
    query, setQuery,
    list, loading, hasMore, npl, maxCollect,
    collectibility, setCollectibility,
    loadMore, search, formatIDR, reload: loadInitial,
  };
};
