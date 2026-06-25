/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  const [isLoading, setIsLoading]       = useState(false);
  const [countries, setCountries]       = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [form, setForm]                 = useState({ name: '', country_id: '', latitude: '', longitude: '' });
  const [fieldErrors, setFieldErrors]   = useState({});
  const [generalError, setGeneralError] = useState('');

  // fetch countries when modal opens
  useEffect(() => {
    if (open) {
      setCountriesLoading(true);
      apiPost('/countries/list', { page: 1, limit: 100, search: '' })
        .then((res) => setCountries(res?.data?.data ?? res?.data ?? []))
        .catch(() => setCountries([]))
        .finally(() => setCountriesLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (isEdit && itemData) {
        setForm({
          name:       itemData.name       || '',
          country_id: itemData.country_id || '',
          latitude:   itemData.latitude   || '',
          longitude:  itemData.longitude  || '',
        });
      } else {
        setForm({ name: '', country_id: '', latitude: '', longitude: '' });
      }
      setFieldErrors({});
      setGeneralError('');
    }
  }, [open, isEdit, itemData]);

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim())           errors.name       = 'Name is required';
    else if (form.name.length > 255) errors.name       = 'Max 255 characters';
    if (!form.country_id)            errors.country_id = 'Country is required';
    if (form.latitude  && !/^-?\d+(\.\d+)?$/.test(form.latitude.trim()))  errors.latitude  = 'Enter a valid latitude';
    if (form.longitude && !/^-?\d+(\.\d+)?$/.test(form.longitude.trim())) errors.longitude = 'Enter a valid longitude';
    if (form.latitude  && form.latitude.length  > 255) errors.latitude  = 'Max 255 characters';
    if (form.longitude && form.longitude.length > 255) errors.longitude = 'Max 255 characters';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const body = { name: form.name.trim(), country_id: String(form.country_id) };
    if (form.latitude.trim())  body.latitude  = form.latitude.trim();
    if (form.longitude.trim()) body.longitude = form.longitude.trim();

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/states/update/${itemId}`, body)
        .then(() => { toast.success('State updated successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/states/create', body)
        .then(() => { toast.success('State created successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit State' : 'Add State'} maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          <Select
            label="Country *"
            value={form.country_id}
            onChange={(e) => setField('country_id', e.target.value)}
            options={countries.map((c) => ({ label: c.name, value: c.id }))}
            error={fieldErrors.country_id}
            disabled={countriesLoading}
            placeholder="Select country"
            required
            fullWidth
          />

          <TextInput
            autoFocus
            label="State Name *"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={fieldErrors.name}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput
              label="Latitude" placeholder="e.g. 22.2587"
              value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
              error={fieldErrors.latitude}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextInput
              label="Longitude" placeholder="e.g. 71.1924"
              value={form.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
              error={fieldErrors.longitude}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add State'}
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
    apiDelete(`/states/delete/${itemId}`)
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete State" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>Are you sure you want to delete <strong>{nameRef.current}</strong>?</Typography>
      <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>This may affect cities linked to this state.</Alert>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StatesPage() {
  const { can } = usePermissions();
  const canCreate = can('state_create');
  const canEdit   = can('state_edit');
  const canDelete = can('state_delete');
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
  const [filterCountry, setFilterCountry]   = useState('');
  const [filterCountries, setFilterCountries] = useState([]);
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);

  // fetch countries for the toolbar filter
  useEffect(() => {
    apiPost('/countries/list', { page: 1, limit: 100, search: '' })
      .then((res) => setFilterCountries(res?.data?.data ?? res?.data ?? []))
      .catch(() => {});
  }, []);

  const getData = (searchVal = search, pageVal = pageValue, countryVal = filterCountry, limitVal = limit) => {
    setIsTableLoading(true);
    const body = { page: pageVal + 1, limit: limitVal, search: searchVal.trim() };
    if (countryVal) body.country_id = String(countryVal);
    apiPost('/states/list', body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    apiGet(`/states/${id}`)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => { getData(); }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0, filterCountry); }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleCountryFilter = (e) => {
    const val = e.target.value;
    setFilterCountry(val); setOffset(0); setPageValue(0); getData(search, 0, val);
  };

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset); setPageValue(newPage); getData(search, newPage, filterCountry);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, filterCountry, newLimit);
  };

  const handleOpenEdit   = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true); getById(row.id); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  const columns = [
    { key: '#',         label: '#',        width: 60,  render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'name',      label: 'Name',                 render: (row) => <Typography sx={{ fontWeight: 700 }}>{row.name}</Typography> },
    { key: 'country',   label: 'Country',              render: (row) => <Chip label={row.country?.name || '—'} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: 12 }} /> },
    { key: 'latitude',  label: 'Latitude',             render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'monospace' }}>{row.latitude || '—'}</Typography> },
    { key: 'longitude', label: 'Longitude',            render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'monospace' }}>{row.longitude || '—'}</Typography> },
    { key: 'createdAt', label: 'Created',              render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography> },
    {
      key: 'actions', label: 'Actions', width: 110, align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {canEdit && <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#1B4332' }}><Edit fontSize="small" /></IconButton></Tooltip>}
          {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}><Delete fontSize="small" /></IconButton></Tooltip>}
        </Box>
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="state_list">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          States
          {!isTableLoading && <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Select
            label="Filter by Country"
            value={filterCountry}
            onChange={handleCountryFilter}
            options={[
              { label: 'All Countries', value: '' },
              ...filterCountries.map((c) => ({ label: c.name, value: c.id })),
            ]}
            size="small"
            sx={{ width: 220 }}
          />
          <TextInput
            size="small" placeholder="Search by name…" value={search}
            onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }}
            sx={{ width: 240 }}
          />
          {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add State
          </Button>
          )}
        </Stack>
      </Box>

      <Table
        columns={columns} rows={tableData} loading={isTableLoading}
        emptyMessage={search ? `No states found for "${search}"` : filterCountry ? 'No states found for this country' : 'No states yet'}
        count={count} page={pageValue} rowsPerPage={limit} onPageChange={handleTableChange} onRowsPerPageChange={handleLimitChange} minWidth={700}
      />

      <FormModal open={openAdd}  itemId={null}   itemData={null}     onClose={handleCloseAdd}    onSaved={() => getData(search, pageValue, filterCountry)} />
      <FormModal open={openEdit} itemId={itemId} itemData={itemData} onClose={handleCloseEdit}   onSaved={() => getData(search, pageValue, filterCountry)} />
      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name} onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, filterCountry);
        }}
      />
    </AdminShell>
  );
}
