/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import CountrySelect from '@/components/shared/CountrySelect';
import StateSelect from '@/components/shared/StateSelect';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Chip, Skeleton, Stack, Alert, CircularProgress, Divider,
} from '@mui/material';
import { Add, Edit, Delete, Close, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const limit = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ count = 10 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 8 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search, filterCountry, filterState }) {
  const msg = search
    ? `No cities found for "${search}"`
    : filterState || filterCountry
      ? 'No cities found for selected filters'
      : 'No cities yet';
  return (
    <TableRow>
      <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>{msg}</Typography>
        <Typography variant="body2" color="text.disabled">
          {search || filterState || filterCountry
            ? 'Try different filters.'
            : 'Click "Add City" to create your first one.'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  // state
  const [isLoading, setIsLoading]       = useState(false);
  const [form, setForm]                 = useState({ name: '', country_id: '', state_id: '', latitude: '', longitude: '' });
  const [fieldErrors, setFieldErrors]   = useState({});
  const [generalError, setGeneralError] = useState('');

  // pre-fill on open
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

  // cascading: country change clears state
  const handleCountryChange = (val) => {
    setForm((p) => ({ ...p, country_id: val, state_id: '' }));
    if (fieldErrors.country_id) setFieldErrors((p) => ({ ...p, country_id: '' }));
    if (fieldErrors.state_id)   setFieldErrors((p) => ({ ...p, state_id: '' }));
  };

  // StateSelect internally calls onChange('') when countryId changes,
  // so we intercept that and only update state_id
  const handleStateChange = (val) => {
    setForm((p) => ({ ...p, state_id: val }));
    if (fieldErrors.state_id) setFieldErrors((p) => ({ ...p, state_id: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.country_id)              errors.country_id = 'Country is required';
    if (!form.state_id)                errors.state_id   = 'State is required';
    if (!form.name.trim())             errors.name       = 'Name is required';
    else if (form.name.length > 255)   errors.name       = 'Max 255 characters';
    if (form.latitude  && form.latitude.length  > 255) errors.latitude  = 'Max 255 characters';
    if (form.longitude && form.longitude.length > 255) errors.longitude = 'Max 255 characters';
    return errors;
  };

  // api calls
  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    // always send both state_id + country_id (backend uniqueness requires state_id)
    const body = {
      name:       form.name.trim(),
      country_id: Number(form.country_id),
      state_id:   Number(form.state_id),
    };
    if (form.latitude.trim())  body.latitude  = form.latitude.trim();
    if (form.longitude.trim()) body.longitude = form.longitude.trim();

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/cities/update/${itemId}`, body)
        .then(() => {
          toast.success('City updated successfully!');
          onSaved();
          onClose();
        })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/cities/create', body)
        .then(() => {
          toast.success('City created successfully!');
          onSaved();
          onClose();
        })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? 'Edit City' : 'Add City'}
        <IconButton onClick={onClose} size="small" aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          {/* Step 1 — Country */}
          <CountrySelect
            value={form.country_id}
            onChange={handleCountryChange}
            error={!!fieldErrors.country_id}
            helperText={fieldErrors.country_id}
          />

          {/* Step 2 — State (filtered by selected country) */}
          <StateSelect
            value={form.state_id}
            onChange={handleStateChange}
            countryId={form.country_id || null}
            error={!!fieldErrors.state_id}
            helperText={fieldErrors.state_id}
          />

          {/* Step 3 — City name */}
          <TextField
            fullWidth label="City Name *" value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={!!fieldErrors.name} helperText={fieldErrors.name}
          />

          {/* Step 4 — Lat / Lng */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth label="Latitude" placeholder="e.g. 23.0225" value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
              error={!!fieldErrors.latitude} helperText={fieldErrors.latitude}
            />
            <TextField
              fullWidth label="Longitude" placeholder="e.g. 72.5714" value={form.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
              error={!!fieldErrors.longitude} helperText={fieldErrors.longitude}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading
              ? <CircularProgress size={20} color="inherit" />
              : isEdit ? 'Save Changes' : 'Add City'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemName, onClose, onDeleted }) {
  // state
  const [isLoading, setIsLoading] = useState(false);

  // stable ref so MUI close animation doesn't lose data
  const nameRef = useRef(itemName);
  if (itemName) nameRef.current = itemName;

  // api call
  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    apiDelete(`/cities/delete/${itemId}`)
      .then(() => {
        toast.success(`"${nameRef.current}" deleted.`);
        onDeleted();
        onClose();
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete City</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography>
          Are you sure you want to delete <strong>{nameRef.current}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button variant="contained" onClick={handleDelete} disabled={isLoading}
          sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 100 }}>
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CitiesPage() {
  // state
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
  const [filterState, setFilterState]       = useState('');
  const [tableData, setTableData]           = useState([]);

  // api calls
  const getData = (
    searchVal  = search,
    pageVal    = pageValue,
    countryVal = filterCountry,
    stateVal   = filterState,
  ) => {
    setIsTableLoading(true);
    const body = { page: pageVal + 1, limit, search: searchVal.trim() };
    if (countryVal) body.country_id = Number(countryVal);
    if (stateVal)   body.state_id   = Number(stateVal);

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
      .catch(() => {
        // fallback — itemData stays as the row data already set
      });
  };

  // effects
  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => {
        setOffset(0);
        setPageValue(0);
        getData(search, 0, filterCountry, filterState);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  // filter handlers — both reset to page 1
  const handleCountryFilter = (val) => {
    setFilterCountry(val);
    setFilterState('');    // clear state filter when country changes
    setOffset(0);
    setPageValue(0);
    getData(search, 0, val, '');
  };

  const handleStateFilter = (val) => {
    setFilterState(val);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, filterCountry, val);
  };

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset);
    setPageValue(newPage);
    getData(search, newPage, filterCountry, filterState);
  };

  const handleOpenEdit = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenEdit(true);
    getById(row.id);   // fetch fresh in background
  };

  const handleOpenDelete = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenDelete(true);
  };

  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  return (
    <AdminShell>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Cities
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Cascading filters */}
          <Box sx={{ width: 200 }}>
            <CountrySelect
              value={filterCountry}
              onChange={handleCountryFilter}
              label="Filter by Country"
              placeholder="All Countries"
              size="small"
            />
          </Box>
          <Box sx={{ width: 200 }}>
            <StateSelect
              value={filterState}
              onChange={handleStateFilter}
              countryId={filterCountry || null}
              label="Filter by State"
              placeholder="All States"
              size="small"
            />
          </Box>

          {/* Search */}
          <TextField
            size="small" placeholder="Search by city name…" value={search}
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
            sx={{ width: 220 }}
          />

          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add City
          </Button>
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Latitude</TableCell>
                <TableCell>Longitude</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center" sx={{ width: 110 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows count={limit} />
              ) : tableData.length === 0 ? (
                <EmptyState search={search} filterCountry={filterCountry} filterState={filterState} />
              ) : (
                tableData.map((row, idx) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>
                      {offset + idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                    <TableCell>
                      <Chip label={row.state?.name || '—'} size="small"
                        sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: 12 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={row.country?.name || '—'} size="small"
                        sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: 12 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'monospace' }}>
                      {row.latitude  || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'monospace' }}>
                      {row.longitude || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#1B4332' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={count}
          page={pageValue}
          onPageChange={(_, newPage) => handleTableChange(newPage)}
          rowsPerPage={limit}
          rowsPerPageOptions={[limit]}
          sx={{ borderTop: '1px solid #E7E5E4' }}
        />
      </Paper>

      {/* ── Modals ── */}
      <FormModal open={openAdd}  itemId={null}   itemData={null}
        onClose={handleCloseAdd}
        onSaved={() => getData(search, pageValue, filterCountry, filterState)} />

      <FormModal open={openEdit} itemId={itemId} itemData={itemData}
        onClose={handleCloseEdit}
        onSaved={() => getData(search, pageValue, filterCountry, filterState)} />

      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) {
            handleTableChange(pageValue - 1);
          } else {
            getData(search, pageValue, filterCountry, filterState);
          }
        }}
      />
    </AdminShell>
  );
}
