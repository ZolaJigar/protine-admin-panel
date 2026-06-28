/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton, Tooltip, Chip, Paper,
} from '@mui/material';
import { Delete, Search, Visibility, Email, Phone } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { contactUsAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ open, itemData, onClose }) {
  const ref = useRef(itemData);
  if (itemData) ref.current = itemData;
  const item = ref.current;
  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title="Contact Us Entry" maxWidth="sm"
      actions={<Button variant="outlined" onClick={onClose}>Close</Button>}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { label: 'Title',       value: <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography> },
          { label: 'Phone',       value: item.phone
              ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Phone sx={{ fontSize: 16, color: '#1B4332' }} /><Typography variant="body2">{item.phone}</Typography></Box>
              : <Typography variant="body2" color="text.disabled">—</Typography> },
          { label: 'Email',       value: item.email
              ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Email sx={{ fontSize: 16, color: '#1B4332' }} /><Typography variant="body2">{item.email}</Typography></Box>
              : <Typography variant="body2" color="text.disabled">—</Typography> },
          { label: 'Created',     value: <Typography variant="body2" color="text.secondary">{formatDate(item.createdAt)}</Typography> },
          { label: 'Updated',     value: <Typography variant="body2" color="text.secondary">{formatDate(item.updatedAt)}</Typography> },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Typography sx={{ width: 90, fontWeight: 700, color: 'text.secondary', flexShrink: 0, fontSize: 13, pt: 0.25 }}>{label}</Typography>
            <Box sx={{ flex: 1 }}>{value}</Box>
          </Box>
        ))}
        {item.description && (
          <Box>
            <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13, mb: 0.75 }}>Description</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FBF8' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{item.description}</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemTitle, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef(itemTitle);
  if (itemTitle) ref.current = itemTitle;

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    contactUsAPI.delete(itemId)
      .then(() => { toast.success(`"${ref.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Delete failed.'))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Entry" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete <strong>{ref.current}</strong>? This cannot be undone.
      </Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContactUsPage() {
  const { can }   = usePermissions();
  const canView   = can('contact_us_list');
  const canDelete = can('contact_us_delete');

  const [tableData,      setTableData]      = useState([]);
  const [count,          setCount]          = useState(0);
  const [pageValue,      setPageValue]      = useState(0);
  const [limit,          setLimit]          = useState(DEFAULT_LIMIT);
  const [offset,         setOffset]         = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [search,         setSearch]         = useState('');
  const [isSearch,       setIsSearch]       = useState(false);

  const [itemId,     setItemId]     = useState(null);
  const [itemData,   setItemData]   = useState(null);
  const [openView,   setOpenView]   = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const getData = (searchVal = search, pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    const params = { page: pageVal + 1, limit: limitVal };
    if (searchVal.trim()) params.search = searchVal.trim();
    contactUsAPI.list(params)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to load entries.'))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    contactUsAPI.getById(id)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
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

  const handleOpenView   = (row) => { setItemId(row.id); setItemData(row); setOpenView(true); getById(row.id); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseView   = () => { setOpenView(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography>,
    },
    {
      key: 'title', label: 'Title',
      render: (row) => <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row.title}</Typography>,
    },
    {
      key: 'phone', label: 'Phone',
      render: (row) => row.phone
        ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Phone sx={{ fontSize: 15, color: '#1B4332' }} />
            <Typography variant="body2" sx={{ fontSize: 13 }}>{row.phone}</Typography>
          </Box>
        )
        : <Typography variant="body2" color="text.disabled">—</Typography>,
    },
    {
      key: 'email', label: 'Email',
      render: (row) => row.email
        ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Email sx={{ fontSize: 15, color: '#1B4332' }} />
            <Typography variant="body2" sx={{ fontSize: 13 }}>{row.email}</Typography>
          </Box>
        )
        : <Typography variant="body2" color="text.disabled">—</Typography>,
    },
    {
      key: 'description', label: 'Description',
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, maxWidth: 260 }} noWrap>
          {row.description || '—'}
        </Typography>
      ),
    },
    {
      key: 'createdAt', label: 'Created',
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography>,
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {canView && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleOpenView(row)} sx={{ color: '#0369A1' }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="contact_us_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Contact Us
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>
        <TextInput
          size="small"
          placeholder="Search title, email, phone…"
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
          sx={{ width: 280 }}
        />
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No entries found for "${search}"` : 'No contact us entries yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={700}
      />

      {/* ── Modals ── */}
      <ViewModal open={openView} itemData={itemData} onClose={handleCloseView} />
      <DeleteModal
        open={openDelete} itemId={itemId} itemTitle={itemData?.title}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, limit);
        }}
      />
    </AdminShell>
  );
}
