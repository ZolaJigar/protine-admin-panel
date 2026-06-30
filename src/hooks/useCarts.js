'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { cartsAPI } from '@/lib/api';

const DEFAULT_LIMIT = 10;

/**
 * useCarts — list, filters, pagination, and bulk actions for the carts list page.
 */
export function useCarts(initialUserId = null) {
  // ── Table state ──────────────────────────────────────────────────────────────
  const [tableData,      setTableData]      = useState([]);
  const [count,          setCount]          = useState(0);
  const [pageValue,      setPageValue]      = useState(0);
  const [limit,          setLimit]          = useState(DEFAULT_LIMIT);
  const [offset,         setOffset]         = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [userId,       setUserId]       = useState(initialUserId);
  const [isSearch,     setIsSearch]     = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats,        setStats]        = useState({ total: null, active: null, converted: null, abandoned: null });
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Fetch stats via analytics endpoint ───────────────────────────────────
  const fetchStats = () => {
    setStatsLoading(true);
    cartsAPI.analytics()
      .then((res) => {
        const d = res?.data ?? {};
        // Build per-status counts from cartsByStatus array
        const byStatus = {};
        (d.cartsByStatus ?? []).forEach(({ status, count }) => {
          byStatus[status] = Number(count);
        });
        setStats({
          total:     d.totalCarts  ?? 0,
          active:    byStatus.active    ?? 0,
          converted: byStatus.converted ?? 0,
          abandoned: byStatus.abandoned ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  // ── Fetch table data ──────────────────────────────────────────────────────
  const getData = (
    searchVal  = search,
    pageVal    = pageValue,
    limitVal   = limit,
    statusVal  = filterStatus,
    userIdVal  = userId,
  ) => {
    setIsTableLoading(true);
    const params = { page: pageVal + 1, limit: limitVal };
    if (searchVal.trim()) params.search  = searchVal.trim();
    if (statusVal)        params.status  = statusVal;
    if (userIdVal)        params.user_id = userIdVal;

    cartsAPI.list(params)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to load carts.'))
      .finally(() => setIsTableLoading(false));
  };

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
    getData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSearch) return;
    const t = setTimeout(() => {
      setOffset(0); setPageValue(0);
      getData(search, 0, limit, filterStatus, userId);
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    setOffset(newPage * limit); setPageValue(newPage);
    getData(search, newPage, limit, filterStatus, userId);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit); setOffset(0); setPageValue(0);
    getData(search, 0, newLimit, filterStatus, userId);
  };

  const handleStatusFilter = (val) => {
    setFilterStatus(val); setOffset(0); setPageValue(0);
    getData(search, 0, limit, val, userId);
  };

  const handleUserIdFilter = (val) => {
    setUserId(val); setOffset(0); setPageValue(0);
    getData(search, 0, limit, filterStatus, val);
  };

  const handleClearFilters = () => {
    setSearch(''); setFilterStatus(''); setUserId(null); setOffset(0); setPageValue(0);
    getData('', 0, limit, '', null);
  };

  // ── Row-level actions ─────────────────────────────────────────────────────
  const handleClearCart = (cartId, onDone) => {
    cartsAPI.clear(cartId)
      .then(() => {
        toast.success('Cart cleared successfully.');
        getData(search, pageValue, limit, filterStatus, userId);
        fetchStats();
        onDone?.();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to clear cart.'));
  };

  const handleMarkAbandoned = (cartId) => {
    cartsAPI.updateStatus(cartId, { status: 'abandoned' })
      .then(() => {
        toast.success('Cart marked as abandoned.');
        setTableData((prev) =>
          prev.map((c) => c.id === cartId ? { ...c, status: 'abandoned' } : c)
        );
        fetchStats();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to update cart status.'));
  };

  const hasFilters = search || filterStatus || userId;

  return {
    // data
    tableData,
    count,
    pageValue,
    limit,
    offset,
    isTableLoading,
    // filters
    search, setSearch,
    filterStatus,
    userId,
    isSearch, setIsSearch,
    hasFilters,
    // stats
    stats,
    statsLoading,
    // handlers
    handlePageChange,
    handleLimitChange,
    handleStatusFilter,
    handleUserIdFilter,
    handleClearFilters,
    handleClearCart,
    handleMarkAbandoned,
    // manual refresh
    refresh: () => getData(),
    fetchStats,
  };
}
