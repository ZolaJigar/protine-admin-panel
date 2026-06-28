/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_LIMIT } from '@/constants/values';
import { dateFormat12 } from '@/utils/functions';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = dateFormat12;

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  const [isLoading, setIsLoading]       = useState(false);
  const [name, setName]                 = useState('');
  const [nameError, setNameError]       = useState('');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (open) {
      setName(isEdit && itemData ? itemData.name : '');
      setNameError('');
      setGeneralError('');
    }
  }, [open, isEdit, itemData]);

  const validateName = (val) => {
    if (!val.trim())      return 'Name is required';
    if (val.length > 255) return 'Max 255 characters';
    return null;
  };

  const handleBlur = () => {
    const msg = validateName(name);
    setNameError(msg || '');
  };

  const validate = () => {
    const err = validateName(name);
    return err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const err = validate();
    if (err) { setNameError(err); return; }

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/countries/update/${itemId}`, { name: name.trim() })
        .then(() => { toast.success('Country updated successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/countries/create', { name: name.trim() })
        .then(() => { toast.success('Country created successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Country' : 'Add Country'} maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}
          <TextInput
            autoFocus
            label="Country Name *"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(''); }}
            onBlur={handleBlur}
            error={nameError}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add Country'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemName, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef(itemName);
  if (itemName) nameRef.current = itemName;

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    apiDelete(`/countries/delete/${itemId}`)
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Country" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>Are you sure you want to delete <strong>{nameRef.current}</strong>?</Typography>
      <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>This may affect states and cities linked to this country.</Alert>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CountriesPage() {
  const { can } = usePermissions();
  const canCreate = can('country_create');
  const canEdit   = can('country_edit');
  const canDelete = can('country_delete');
  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemId, setItemId]                 = useState(null);
  const [itemData, setItemData]             = useState(null);
  const [openAdd, setOpenAdd]               = useState(false);
  const [openEdit, setOpenEdit]             = useState(false);
  const [openDelete, setOpenDelete]         = useState(false);
  const [count, setCount]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [search, setSearch]                 = useState('');
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);

  const getData = (searchVal = search, pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    apiPost('/countries/list', { page: pageVal + 1, limit: limitVal, search: searchVal.trim() })
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    apiGet(`/countries/${id}`)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => { getData(); }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0); }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset);
    setPageValue(newPage);
    getData(search, newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, newLimit);
  };

  const handleOpenEdit   = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true); getById(row.id); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  const columns = [
    { key: '#',         label: '#',       width: 60,  render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'name',      label: 'Name',                render: (row) => <Typography sx={{ fontWeight: 700 }}>{row.name}</Typography> },
    { key: 'createdAt', label: 'Created',             render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography> },
    {
      key: 'actions', label: 'Actions', width: 110, align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {canEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#1B4332' }}>
              <Edit fontSize="small" />
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
    <AdminShell requiredPermission="country_list">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Countries
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextInput
            size="small" placeholder="Search by name…" value={search}
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
          {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Country
          </Button>
          )}
        </Stack>
      </Box>

      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No countries found for "${search}"` : 'No countries yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={500}
      />

      <FormModal open={openAdd}  itemId={null}   itemData={null}     onClose={handleCloseAdd}    onSaved={() => getData(search, pageValue)} />
      <FormModal open={openEdit} itemId={itemId} itemData={itemData} onClose={handleCloseEdit}   onSaved={() => getData(search, pageValue)} />
      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name} onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue);
        }}
      />
    </AdminShell>
  );
}
