'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Table as MuiTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Typography,
  Box,
  Select,
  MenuItem,
  IconButton,
  InputBase,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// ─── Skeleton rows ──────────────────────────────────────────────────────────────
function SkeletonRows({ colCount, rowCount }) {
  return Array.from({ length: rowCount }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: colCount }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ────────────────────────────────────────────────────────────────
function EmptyRow({ colCount, message }) {
  return (
    <TableRow>
      <TableCell colSpan={colCount} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Single page button ─────────────────────────────────────────────────────────
function PageBtn({ label, active, onClick }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        minWidth: 30,
        height: 30,
        px: 0.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        border: '1px solid',
        borderColor: active ? '#1B4332' : '#E7E5E4',
        bgcolor: active ? '#1B4332' : '#fff',
        color: active ? '#FFF8F0' : '#1C1917',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        lineHeight: 1,
        userSelect: 'none',
        '&:hover': {
          bgcolor: active ? '#0D2B1F' : '#F1F5F0',
          borderColor: '#1B4332',
        },
      }}
    >
      {label}
    </Box>
  );
}

// ─── Page buttons with smart windowing ─────────────────────────────────────────
function PageButtons({ page, totalPages, onPageChange }) {
  const pages = new Set([0, totalPages - 1]);
  for (let i = page - 2; i <= page + 2; i++) {
    if (i >= 0 && i < totalPages) pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {result.map((item, i) =>
        item === '…' ? (
          <Typography key={`e-${i}`} variant="caption"
            sx={{ color: 'text.disabled', px: 0.25, userSelect: 'none', lineHeight: 1 }}>
            …
          </Typography>
        ) : (
          <PageBtn
            key={item}
            label={item + 1}
            active={item === page}
            onClick={() => onPageChange(item)}
          />
        )
      )}
    </Box>
  );
}

// ─── Bottom bar ─────────────────────────────────────────────────────────────────
function BottomBar({ page, count, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));

  const [jumpVal, setJumpVal] = useState('');
  useEffect(() => { setJumpVal(''); }, [page]);

  const handleJump = (e) => {
    if (e.key !== 'Enter') return;
    const n = parseInt(jumpVal, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) onPageChange?.(n - 1);
    setJumpVal('');
  };

  const LIMIT_OPTIONS = [5, 10, 25, 50, 100];

  return (
    <Box sx={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      px: 2,
      py: 1.25,
      borderTop: '1px solid #E7E5E4',
      bgcolor: '#FAFAF9',
      minHeight: 48,
    }}>

      {/* Rows per page — far left */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          Rows per page:
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={(e) => { onRowsPerPageChange?.(Number(e.target.value)); onPageChange?.(0); }}
          size="small"
          variant="outlined"
          sx={{
            fontSize: 13,
            height: 30,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E7E5E4' },
            '& .MuiSelect-select': { py: 0.4, px: 1 },
          }}
        >
          {LIMIT_OPTIONS.map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>{opt}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Go to page — absolutely centered */}
      <Box sx={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
      }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>Page</Typography>
        <InputBase
          value={jumpVal}
          onChange={(e) => setJumpVal(e.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={handleJump}
          placeholder={String(page + 1)}
          inputProps={{ 'aria-label': 'Jump to page', style: { textAlign: 'center', width: 32, fontSize: 13, padding: 0 } }}
          sx={{
            height: 30, border: '1px solid #E7E5E4', borderRadius: 1, px: 0.75, bgcolor: '#fff',
            '&:focus-within': { borderColor: '#1B4332' },
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>of {totalPages}</Typography>
      </Box>

      {/* Nav buttons — far right */}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>

        {/* Prev */}
        <IconButton size="small" onClick={() => onPageChange?.(page - 1)} disabled={page === 0}
          sx={{ width: 28, height: 28, borderRadius: 1, border: '1px solid #E7E5E4', bgcolor: '#fff', p: 0, color: page === 0 ? '#C4BAB4' : '#1B4332' }}
          aria-label="Previous page">
          <ChevronLeft fontSize="small" />
        </IconButton>

        {/* Page number buttons */}
        <PageButtons page={page} totalPages={totalPages} onPageChange={onPageChange} />

        {/* Next */}
        <IconButton size="small" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages - 1}
          sx={{ width: 28, height: 28, borderRadius: 1, border: '1px solid #E7E5E4', bgcolor: '#fff', p: 0, color: page >= totalPages - 1 ? '#C4BAB4' : '#1B4332' }}
          aria-label="Next page">
          <ChevronRight fontSize="small" />
        </IconButton>

      </Box>
    </Box>
  );
}

/**
 * Table — custom table with skeleton, empty state, and pagination.
 *
 * Props:
 *   columns              Array<{ key, label, align?, width?, render? }>
 *   rows                 Array<object>
 *   loading              bool
 *   emptyMessage         string
 *   skeletonRows         number         — default 5
 *   page                 number         — 0-indexed
 *   count                number         — total rows
 *   rowsPerPage          number
 *   onPageChange         (newPage) => void
 *   onRowsPerPageChange  (newLimit) => void
 *   showPagination       bool           — default true
 *   minWidth             number         — default 650
 *   sx                   object
 */
export default function Table({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'No data found',
  skeletonRows = 5,
  page = 0,
  count = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
  minWidth = 650,
  sx = {},
}) {
  return (
    <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', ...sx }}>
      <Box sx={{ overflowX: 'auto' }}>
        <MuiTable sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align ?? 'left'} sx={{ width: col.width }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <SkeletonRows colCount={columns.length} rowCount={skeletonRows} />
            ) : rows.length === 0 ? (
              <EmptyRow colCount={columns.length} message={emptyMessage} />
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id ?? idx} hover>
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align ?? 'left'}>
                      {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </MuiTable>
      </Box>

      {showPagination && (
        <BottomBar
          page={page}
          count={count}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </Paper>
  );
}
