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

  const [isLoading, setIsLoading]             = useState(false);
  const [countries, setCountries]             = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [states, setStates]                   = useState([]);
  const [statesLoading, setStatesLoading]     = useState(false);
  const [form, setForm]                       = useState({ name: '', country_id: '', state_id: '', latitude: '', longitude: '' });
  const [fieldErrors, setFieldErrors]         = useState({});
  const [generalError, setGeneralError]       = useState('');

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

  // fetch states whenever country_id changes (and a country is selected)
  useEffect(() => {
    if (!form.country_id) { setStates([]); return; }
    setStatesLoading(true);
    apiPost('/states/list', { page: 1, limit: 100, search: '', country_id: String(form.country_id) })
      .then((res) => setStates(res?.data?.data ?? res?.data ?? []))
      .catch(() => setStates([]))
      .finally(() => setStatesLoading(false));
  }, [form.country_id]);

  useEffect(() => {
    if (open) {
      if (isEdit && itemData) {
        setForm({
          name:       itemData.name       || '',
          country_id: itemData.country_id || '',
          state_id:   itemData.state_id   || '',
          latitude:   itemData.latitude   || '',
          longitude:  itemData.longitude  || '',
        });
      } else {
        setForm({ name: '', country_id: '', state_id: '', latitude: '', longitude: '' });
      }
      setFieldErrors({});
      setGeneralError('');
    }
  }, [open, isEdit, itemData]);

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: '' }));
  };

  const handleCountryChange = (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, country_id: val, state_id: '' }));
    if (fieldErrors.country_id) setFieldErrors((p) => ({ ...p, country_id: '' }));
    if (fieldErrors.state_id)   setFieldErrors((p) => ({ ...p, state_id: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.country_id)            errors.country_id = 'Country is required';
    if (!form.state_id)              errors.state_id   = 'State is required';
    if (!form.name.trim())           errors.name       = 'Name is required';
    else if (form.name.length > 255) errors.name       = 'Max 255 characters';
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

    const body = {
      name:       form.name.trim(),
      country_id: String(form.country_id),
      state_id:   String(form.state_id),
    };
    if (form.latitude.trim())  body.latitude  = form.latitude.trim();
    if (form.longitude.trim()) body.longitude = form.longitude.trim();

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/cities/update/${itemId}`, body)
        .then(() => { toast.success('City updated successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/cities/create', body)
        .then(() => { toast.success('City created successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit City' : 'Add City'} maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          <Select
            label="Country *"
            value={form.country_id}
            onChange={handleCountryChange}
            options={countries.map((c) => ({ label: c.name, value: c.id }))}
            error={fieldErrors.country_id}
            disabled={countriesLoading}
            placeholder="Select country"
            required
            fullWidth
          />

          <Select
            label="State *"
            value={form.state_id}
            onChange={(e) => setField('state_id', e.target.value)}
            options={states.map((s) => ({ label: s.name, value: s.id }))}
            error={fieldErrors.state_id}
            disabled={statesLoading || !form.country_id}
            placeholder={!form.country_id ? 'Select a country first' : 'Select state'}
            required
            fullWidth
          />

          <TextInput
            label="City Name *"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={fieldErrors.name}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput
              label="Latitude" placeholder="e.g. 23.0225"
              value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
              error={fieldErrors.latitude}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextInput
              label="Longitude" placeholder="e.g. 72.5714"
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
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add City'}
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
    apiDelete(`/cities/delete/${itemId}`)
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete City" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>Are you sure you want to delete <strong>{nameRef.current}</strong>? This action cannot be undone.</Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CitiesPage() {
  const { can } = usePermissions();
  const canCreate = can('city_create');
  const canEdit   = can('city_edit');
  const canDelete = can('city_delete');
  const [isSearch, setIsSearch]               = useState(false);
  const [isTableLoading, setIsTableLoading]   = useState(false);
  const [itemId, setItemId]                   = useState(null);
  const [itemData, setItemData]               = useState(null);
  const [openAdd, setOpenAdd]                 = useState(false);
  const [openEdit, setOpenEdit]               = useState(false);
  const [openDelete, setOpenDelete]           = useState(false);
  const [count, setCount]                     = useState(0);
  const [offset, setOffset]                   = useState(0);
  const [pageValue, setPageValue]             = useState(0);
  const [search, setSearch]                   = useState('');
  const [filterCountry, setFilterCountry]     = useState('');
  const [filterState, setFilterState]         = useState('');
  const [filterCountries, setFilterCountries] = useState([]);
  const [filterStates, setFilterStates]       = useState([]);
  const [limit, setLimit]                     = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]             = useState([]);

  // fetch countries for toolbar filter on mount
  useEffect(() => {
    apiPost('/countries/list', { page: 1, limit: 100, search: '' })
      .then((res) => setFilterCountries(res?.data?.data ?? res?.data ?? []))
      .catch(() => {});
  }, []);

  // fetch states for toolbar filter when country filter changes
  useEffect(() => {
    if (!filterCountry) { setFilterStates([]); return; }
    apiPost('/states/list', { page: 1, limit: 100, search: '', country_id: String(filterCountry) })
      .then((res) => setFilterStates(res?.data?.data ?? res?.data ?? []))
      .catch(() => setFilterStates([]));
  }, [filterCountry]);

  const getData = (searchVal = search, pageVal = pageValue, countryVal = filterCountry, stateVal = filterState, limitVal = limit) => {
    setIsTableLoading(true);
    const body = { page: pageVal + 1, limit: limitVal, search: searchVal.trim() };
    if (countryVal) body.country_id = String(countryVal);
    if (stateVal)   body.state_id   = String(stateVal);
    apiPost('/cities/list', body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    apiGet(`/cities/${id}`)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => { getData(); }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0, filterCountry, filterState); }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleCountryFilter = (e) => {
    const val = e.target.value;
    setFilterCountry(val); setFilterState(''); setFilterStates([]);
    setOffset(0); setPageValue(0); getData(search, 0, val, '');
  };

  const handleStateFilter = (e) => {
    const val = e.target.value;
    setFilterState(val); setOffset(0); setPageValue(0); getData(search, 0, filterCountry, val);
  };

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset); setPageValue(newPage); getData(search, newPage, filterCountry, filterState);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, filterCountry, filterState, newLimit);
  };

  const handleOpenEdit   = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true); getById(row.id); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  const columns = [
    { key: '#',         label: '#',        width: 60,  render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'name',      label: 'Name',                 render: (row) => <Typography sx={{ fontWeight: 700 }}>{row.name}</Typography> },
    { key: 'state',     label: 'State',                render: (row) => <Chip label={row.state?.name || '—'} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: 12 }} /> },
    { key: 'country',   label: 'Country',              render: (row) => <Chip label={row.country?.name || '—'} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: 12 }} /> },
    { key: 'latitude',  label: 'Latitude',             render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'monospace' }}>{row.latitude  || '—'}</Typography> },
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
    <AdminShell requiredPermission="city_list">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Cities
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
            sx={{ width: 200 }}
          />
          <Select
            label="Filter by State"
            value={filterState}
            onChange={handleStateFilter}
            options={[
              { label: 'All States', value: '' },
              ...filterStates.map((s) => ({ label: s.name, value: s.id })),
            ]}
            disabled={!filterCountry}
            size="small"
            sx={{ width: 200 }}
          />
          <TextInput
            size="small" placeholder="Search by city name…" value={search}
            onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }}
            sx={{ width: 220 }}
          />
          {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add City
          </Button>
          )}
        </Stack>
      </Box>

      <Table
        columns={columns} rows={tableData} loading={isTableLoading}
        emptyMessage={search ? `No cities found for "${search}"` : (filterState || filterCountry) ? 'No cities found for selected filters' : 'No cities yet'}
        count={count} page={pageValue} rowsPerPage={limit} onPageChange={handleTableChange} onRowsPerPageChange={handleLimitChange} minWidth={800}
      />

      <FormModal open={openAdd}  itemId={null}   itemData={null}     onClose={handleCloseAdd}    onSaved={() => getData(search, pageValue, filterCountry, filterState)} />
      <FormModal open={openEdit} itemId={itemId} itemData={itemData} onClose={handleCloseEdit}   onSaved={() => getData(search, pageValue, filterCountry, filterState)} />
      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name} onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, filterCountry, filterState);
        }}
      />
    </AdminShell>
  );
}
