'use client';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Divider, Button, CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';

/**
 * Modal — reusable dialog wrapper.
 *
 * Props:
 *   open          bool
 *   onClose       () => void
 *   title         string | ReactNode
 *   children      ReactNode              — dialog body content
 *   actions       ReactNode              — custom footer buttons (overrides default)
 *   maxWidth      'xs'|'sm'|'md'|'lg'   — default 'sm'
 *   fullWidth     bool                   — default true
 *   divider       bool                   — show divider below title, default true
 *
 * Convenience confirm-style props (used when `actions` is not provided):
 *   confirmLabel  string                 — default 'Save'
 *   confirmColor  string                 — sx bgcolor, default gradient green
 *   onConfirm     () => void
 *   confirmLoading bool
 *   cancelLabel   string                 — default 'Cancel'
 *   danger        bool                   — makes confirm button red
 *
 * Usage — custom actions:
 *   <Modal open={open} onClose={onClose} title="Edit Product" actions={
 *     <>
 *       <Button onClick={onClose}>Cancel</Button>
 *       <Button variant="contained" onClick={handleSave}>Save</Button>
 *     </>
 *   }>
 *     <TextInput ... />
 *   </Modal>
 *
 * Usage — confirm style:
 *   <Modal
 *     open={openDelete}
 *     onClose={onClose}
 *     title="Delete Item"
 *     danger
 *     confirmLabel="Delete"
 *     confirmLoading={isLoading}
 *     onConfirm={handleDelete}
 *   >
 *     Are you sure you want to delete this item?
 *   </Modal>
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  divider = true,
  // confirm-style props
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmLoading = false,
  danger = false,
}) {
  const defaultActions = (
    <>
      <Button variant="outlined" onClick={onClose} disabled={confirmLoading}>
        {cancelLabel}
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        disabled={confirmLoading}
        sx={
          danger
            ? { bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 100 }
            : { background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 100 }
        }
      >
        {confirmLoading ? <CircularProgress size={20} color="inherit" /> : confirmLabel}
      </Button>
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      {/* Title */}
      <DialogTitle
        sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1.5 }}
      >
        {title}
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <Close />
        </IconButton>
      </DialogTitle>

      {divider && <Divider />}

      {/* Body */}
      <DialogContent sx={{ pt: 2.5 }}>
        {children}
      </DialogContent>

      {/* Footer */}
      {(actions !== undefined || onConfirm) && (
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {actions !== undefined ? actions : defaultActions}
        </DialogActions>
      )}
    </Dialog>
  );
}
