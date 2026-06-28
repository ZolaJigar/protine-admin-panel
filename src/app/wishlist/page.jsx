/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton, Tooltip, Chip, Avatar,
} from '@mui/material';
import { Delete, Search, ImageNotSupported } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { wishlistAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_LIMIT } from '@/constants/values';
import { dateFormat12, formatPriceIndian } from '@/utils/functions';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate  = dateFormat12;
const formatPrice = formatPriceIndian;

// ─── Small product / variant image ───────────────────────────────────────────
function Thumb({ src, size = 40 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <Avatar variant="rounded" sx={{ width: size, height: size, bgcolor: '#F1F5F0', color: '#A8A29E' }}>
        <ImageNotSupported sx={{ fontSize: size * 0.45 }} />
      </Avatar>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt="" onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover',
        border: '1px solid #E7E5E4', display: 'block', flexShrink: 0 }} />
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, itemId, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    wishlistAPI.delete(itemId)
      .then(() => { toast.success('Wishlist item removed.'); onDeleted(); onClose(); })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Delete failed.'))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Remove Wishlist Item" maxWidth="xs"
      danger confirmLabel="Remove" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>Remove this item from the wishlist? This cannot be undone.</Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const { can }   = usePermissions();
  const canDelete = can('wishlist_delete');

  const [tableData,      setTableData]      = useState([]);
  const [count,          setCount]          = useState(0);
  const [pageValue,      setPageValue]      = useState(0);
  const [limit,          setLimit]          = useState(DEFAULT_LIMIT);
  const [offset,         setOffset]         = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [search,         setSearch]         = useState('');
  const [isSearch,       setIsSearch]       = useState(false);
  const [itemId,         setItemId]         = useState(null);
  const [openDelete,     setOpenDelete]     = useState(false);

  const getData = (searchVal = search, pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    const params = { page: pageVal + 1, limit: limitVal };
    if (searchVal.trim()) params.search = searchVal.trim();
    wishlistAPI.list(params)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to load wishlist.'))
      .finally(() => setIsTableLoading(false));
  };

  useEffect(() => { getData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSearch) return;
    const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0, limit); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit); setPageValue(newPage); getData(search, newPage, limit);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit); setOffset(0); setPageValue(0); getData(search, 0, newLimit);
  };

  const handleOpenDelete  = (row) => { setItemId(row.id); setOpenDelete(true); };
  const handleCloseDelete = ()    => { setOpenDelete(false); setItemId(null); };

  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography>,
    },
    {
      key: 'product', label: 'Product',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Thumb src={row.product?.image} size={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
              {row.product?.name ?? '—'}
            </Typography>
            <Chip
              label={row.product?.category?.name ?? '—'}
              size="small"
              sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600, fontSize: 11, height: 18, mt: 0.25 }}
            />
          </Box>
        </Box>
      ),
    },
    {
      key: 'variant', label: 'Variant',
      render: (row) => {
        const v = row.productVariant;
        if (!v) return <Typography variant="body2" color="text.disabled">—</Typography>;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Thumb src={v.image} size={40} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{v.name}</Typography>
              {v.sku && (
                <Chip label={v.sku} size="small" variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: 10, height: 18, mt: 0.25 }} />
              )}
              {v.weight && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {v.weight} {v.weight_unit ?? ''}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      key: 'price', label: 'Price', align: 'right',
      render: (row) => {
        const v = row.productVariant;
        if (!v) return <Typography variant="body2" color="text.disabled">—</Typography>;
        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
              {formatPrice(v.selling_price)}
            </Typography>
            {v.mrp && parseFloat(v.mrp) > parseFloat(v.selling_price) && (
              <Typography variant="caption" sx={{ color: 'text.disabled', textDecoration: 'line-through' }}>
                {formatPrice(v.mrp)}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      key: 'stock', label: 'Stock', align: 'center', width: 80,
      render: (row) => {
        const qty = row.productVariant?.quantity;
        if (qty == null) return <Typography variant="body2" color="text.disabled">—</Typography>;
        return (
          <Chip
            label={qty > 0 ? qty : 'Out'}
            size="small"
            sx={{
              bgcolor: qty > 0 ? '#D8F3DC' : '#FEE2E2',
              color:   qty > 0 ? '#1B4332' : '#B91C1C',
              fontWeight: 700, fontSize: 12,
            }}
          />
        );
      },
    },
    {
      key: 'user_id', label: 'User ID', align: 'center', width: 80,
      render: (row) => (
        <Chip label={`#${row.user_id}`} size="small" variant="outlined"
          sx={{ fontFamily: 'monospace', fontSize: 12 }} />
      ),
    },
    {
      key: 'createdAt', label: 'Added At',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 80,
      render: (row) => canDelete ? (
        <Tooltip title="Remove">
          <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ];

  return (
    <AdminShell requiredPermission="wishlist_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Wishlist
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>
        <TextInput
          size="small"
          placeholder="Search…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 260 }}
        />
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No wishlist items found for "${search}"` : 'No wishlist items yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={860}
      />

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={openDelete}
        itemId={itemId}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, limit);
        }}
      />
    </AdminShell>
  );
}
