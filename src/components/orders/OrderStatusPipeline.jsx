'use client';

import { Box, Typography, Tooltip } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Cancel, Loop } from '@mui/icons-material';
import { PIPELINE_STEPS, capitalize } from '@/utils/orderUtils';

/**
 * OrderStatusPipeline — horizontal step tracker.
 * Shows the main pipeline: pending → confirmed → processing → packed → shipped → delivered
 * Side states (cancelled, return, reorder) show as a note below.
 *
 * Props:
 *   currentStatus  string
 *   compact        bool   — hide step labels (default false)
 */
export default function OrderStatusPipeline({ currentStatus, compact = false }) {
  const isSideState = ['cancelled', 'return', 'reorder'].includes(currentStatus);
  const currentIdx  = PIPELINE_STEPS.indexOf(currentStatus);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0 }}>
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone   = !isSideState && idx < currentIdx;
          const isActive = !isSideState && idx === currentIdx;

          return (
            <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={capitalize(step)} arrow>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, px: compact ? 0.5 : 0.75 }}>
                  {isDone ? (
                    <CheckCircle sx={{ fontSize: compact ? 16 : 20, color: '#166534' }} />
                  ) : isActive ? (
                    <CheckCircle sx={{ fontSize: compact ? 16 : 20, color: '#1D4ED8' }} />
                  ) : (
                    <RadioButtonUnchecked sx={{ fontSize: compact ? 16 : 20, color: '#D1D5DB' }} />
                  )}
                  {!compact && (
                    <Typography variant="caption" sx={{
                      fontSize: 9, whiteSpace: 'nowrap',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#1D4ED8' : isDone ? '#166534' : '#9CA3AF',
                    }}>
                      {capitalize(step)}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
              {idx < PIPELINE_STEPS.length - 1 && (
                <Box sx={{
                  width: compact ? 12 : 20, height: 2, flexShrink: 0,
                  bgcolor: idx < currentIdx && !isSideState ? '#166534' : '#E5E7EB',
                }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Side-state label */}
      {isSideState && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          {currentStatus === 'cancelled'
            ? <Cancel sx={{ fontSize: 14, color: '#B91C1C' }} />
            : <Loop sx={{ fontSize: 14, color: currentStatus === 'reorder' ? '#0F766E' : '#C2410C' }} />
          }
          <Typography variant="caption" sx={{
            fontWeight: 700, fontSize: 11,
            color: currentStatus === 'cancelled' ? '#B91C1C' : currentStatus === 'return' ? '#C2410C' : '#0F766E',
          }}>
            {capitalize(currentStatus)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
