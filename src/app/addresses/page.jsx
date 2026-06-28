/* eslint-disable react/display-name */
'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton, Tooltip, Chip, Avatar, Stack,
} from '@mui/material';
import { Delete, Search, FilterAltOff } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { addressesAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import {
  DEFAULT_LIMIT,
  ADDRESS_TYPE_OPTIONS,
  ADDRESS_TYPE_COLORS,
  ADDRESS_DEFAULT_OPTIONS,
} from '@/constants/values';
import { dateFormat12, getInitials } from '@/utils/functions';

// ─── Local aliases ────────────────────────────────────────────────────────────
const TYPE_OPTIONS    = ADDRESS_TYPE_OPTIONS;
const TYPE_COLORS     = ADDRESS_TYPE_COLORS;
const DEFAULT_OPTIONS = ADDRESS_DEFAULT_OPTIONS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = dateFormat12;

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    addressesAPI.delete(itemId)
      .then(() => { toast.success('Address deleted.'); onDeleted(); onClose(); })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Delete failed.'))
      .finally(() => setIsLoading(false));
  };
  return (
    <Modal open={open} onClose={onClose} title="Delete Address" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>Are you sure you want to delete this address? This cannot be undone.</Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddressesPage() {
  const { can }   = usePermissions();
  const canDelete = can('address_delete');

  const [tableData,      setTableData]      = useState([]);
  const [count,          setCount]          = useState(0);
  const [pageValue,      setPageValue]      = useState(0);
  const [limit,          setLimit]          = useState(DEFAULT_LIMIT);
  const [offset,         setOffset]         = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Filters
  const [search,        setSearch]        = useState('');
  const [isSearch,      setIsSearch]      = useState(false);
  const [filterType,    setFilterType]    = useState('');
  const [filterDefault, setFilterDefault] = useState('');

  // Modal
  const [itemId,     setItemId]     = useState(null);
  const [openDelete, setOpenDelete] = useState(false);

  const getData = (
    searchVal    = search,
    pageVal      = pageValue,
    limitVal     = limit,
    typeVal      = filterType,
    defaultVal   = filterDefault,
  ) => {
    setIsTableLoading(true);
    const body = { page_number: pageVal + 1, limit: limitVal };
    if (searchVal.trim()) body.search       = searchVal.trim();
    if (typeVal)          body.address_type = typeVal;
    if (defaultVal)       body.is_default   = defaultVal;

    addressesAPI.list(body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to load addresses.'))
      .finally(() => setIsTableLoading(false));
  };

  useEffect(() => { getData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSearch) return;
    const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0, limit, filterType, filterDefault); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange  = (newPage)  => { setOffset(newPage * limit); setPageValue(newPage); getData(search, newPage, limit, filterType, filterDefault); };
  const handleLimitChange  = (newLimit) => { setLimit(newLimit); setOffset(0); setPageValue(0); getData(search, 0, newLimit, filterType, filterDefault); };
  const handleTypeFilter   = (v)        => { setFilterType(v);    setOffset(0); setPageValue(0); getData(search, 0, limit, v, filterDefault); };
  const handleDefaultFilter= (v)        => { setFilterDefault(v); setOffset(0); setPageValue(0); getData(search, 0, limit, filterType, v); };

  const handleClearFilters = () => {
    setSearch(''); setFilterType(''); setFilterDefault(''); setOffset(0); setPageValue(0);
    getData('', 0, limit, '', '');
  };

  const handleOpenDelete  = (row) => { setItemId(row.id); setOpenDelete(true); };
  const handleCloseDelete = ()    => { setOpenDelete(false); setItemId(null); };

  const hasFilters = search || filterType || filterDefault;

  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography>,
    },
    {
      key: 'user', label: 'Customer',
      render: (row) => row.user ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 11, fontWeight: 800 }}>
            {getInitials(row.user.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{row.user.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{row.user.email}</Typography>
          </Box>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">—</Typography>,
    },
    {
      key: 'name', label: 'Recipient',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.mobile}</Typography>
        </Box>
      ),
    },
    {
      key: 'address', label: 'Address',
      render: (row) => (
        <Box sx={{ maxWidth: 240 }}>
          <Typography variant="body2" sx={{ fontSize: 13 }} noWrap>{row.address_line_1}</Typography>
          {row.address_line_2 && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.address_line_2}</Typography>
          )}
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {[row.city?.name, row.state?.name, row.postal_code].filter(Boolean).join(', ')}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'type', label: 'Type', align: 'center',
      render: (row) => {
        const c = TYPE_COLORS[row.address_type] ?? { bg: '#F1F5F9', color: '#475569' };
        return <Chip label={row.address_type} size="small"
          sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, textTransform: 'capitalize', fontSize: 11 }} />;
      },
    },
    {
      key: 'is_default', label: 'Default', align: 'center', width: 80,
      render: (row) => row.is_default
        ? <Chip label="Default" size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700, fontSize: 11 }} />
        : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    {
      key: 'country', label: 'Country',
      render: (row) => <Typography variant="body2" sx={{ fontSize: 13 }}>{row.country?.name ?? '—'}</Typography>,
    },
    {
      key: 'createdAt', label: 'Created',
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography>,
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 70,
      render: (row) => canDelete ? (
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ];

  return (
    <AdminShell requiredPermission="address_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Addresses
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextInput size="small" placeholder="Search name, mobile, address, postal…"
            value={search} onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }}
            sx={{ width: 280 }} />

          <Select label="Type" value={filterType} onChange={(e) => handleTypeFilter(e.target.value)}
            options={TYPE_OPTIONS} size="small" sx={{ minWidth: 130 }} />

          <Select label="Default" value={filterDefault} onChange={(e) => handleDefaultFilter(e.target.value)}
            options={DEFAULT_OPTIONS} size="small" sx={{ minWidth: 130 }} />

          {hasFilters && (
            <Tooltip title="Clear filters">
              <IconButton size="small" onClick={handleClearFilters}
                sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', '&:hover': { bgcolor: '#FECACA' } }}>
                <FilterAltOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table columns={columns} rows={tableData} loading={isTableLoading}
        emptyMessage={hasFilters ? 'No addresses match your filters' : 'No addresses yet'}
        count={count} page={pageValue} rowsPerPage={limit}
        onPageChange={handleTableChange} onRowsPerPageChange={handleLimitChange}
        minWidth={920} />

      {/* ── Delete Modal ── */}
      <DeleteModal open={openDelete} itemId={itemId} onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, limit, filterType, filterDefault);
        }} />
    </AdminShell>
  );
}
