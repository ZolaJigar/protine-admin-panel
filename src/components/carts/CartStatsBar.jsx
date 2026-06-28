'use client';

import { Box, Typography, Paper, Skeleton } from '@mui/material';
import {
  ShoppingCart, CheckCircle, DoNotDisturb, Inventory2,
} from '@mui/icons-material';

function StatCard({ icon, label, value, color, bgColor, loading }) {
  return (
    <Paper sx={{
      px: 2, py: 1.5, borderRadius: 2.5,
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      display: 'flex', alignItems: 'center', gap: 1.5,
      border: `1.5px solid ${bgColor}`,
      minWidth: 140,
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1.5,
        bgcolor: bgColor, color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        '& svg': { fontSize: 20 },
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{
          color: 'text.secondary', fontWeight: 600, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: 0.5, display: 'block',
        }}>
          {label}
        </Typography>
        {loading
          ? <Skeleton variant="text" width={60} height={24} />
          : <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2, color: '#1C1917' }}>
              {value != null ? Number(value).toLocaleString('en-IN') : '—'}
            </Typography>
        }
      </Box>
    </Paper>
  );
}

/**
 * CartStatsBar — 4 compact summary stat cards shown beside the page title.
 * Props: stats { total, active, converted, abandoned }, loading bool
 */
export default function CartStatsBar({ stats = {}, loading = false }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <StatCard icon={<Inventory2 />}    label="Total Carts" value={stats.total}     color="#1D4ED8" bgColor="#DBEAFE" loading={loading} />
      <StatCard icon={<ShoppingCart />}  label="Active"      value={stats.active}    color="#166534" bgColor="#D8F3DC" loading={loading} />
      <StatCard icon={<CheckCircle />}   label="Converted"   value={stats.converted} color="#7C3AED" bgColor="#EDE9FE" loading={loading} />
      <StatCard icon={<DoNotDisturb />}  label="Abandoned"   value={stats.abandoned} color="#475569" bgColor="#F1F5F9" loading={loading} />
    </Box>
  );
}
