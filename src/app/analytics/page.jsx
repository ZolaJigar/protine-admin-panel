'use client';

import AdminShell from '@/components/AdminShell';
import {
  Box, Grid, Paper, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Chip,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const monthlySales = [
  { month: 'Jan', revenue: 28450,  orders: 98  },
  { month: 'Feb', revenue: 31200,  orders: 112 },
  { month: 'Mar', revenue: 29800,  orders: 105 },
  { month: 'Apr', revenue: 38500,  orders: 134 },
  { month: 'May', revenue: 42100,  orders: 148 },
  { month: 'Jun', revenue: 48235,  orders: 162 },
];

const topCategories = [
  { name: 'Hot Sauces',       revenue: 140350, percentage: 29, color: '#B91C1C' },
  { name: 'Ketchup',          revenue: 115200, percentage: 24, color: '#1B4332' },
  { name: 'Mayonnaise',       revenue: 96800,  percentage: 20, color: '#D97706' },
  { name: 'Salad Dressings',  revenue: 72400,  percentage: 15, color: '#0369A1' },
  { name: 'Spreads',          revenue: 57600,  percentage: 12, color: '#7C3AED' },
];

const kpis = [
  { label: 'Avg. Order Value', value: '₹376', trend: '+5.2%', up: true },
  { label: 'Conversion Rate',  value: '3.8%', trend: '+0.4%', up: true },
  { label: 'Return Rate',      value: '2.1%', trend: '-0.3%', up: false },
  { label: 'Customer Repeat',  value: '41%',  trend: '+3.1%', up: true },
];

const maxRevenue = Math.max(...monthlySales.map((m) => m.revenue));

export default function AdminAnalyticsPage() {
  return (
    <AdminShell requiredPermission="analytics_list">
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
                  {kpi.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {kpi.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {kpi.up
                    ? <TrendingUp sx={{ fontSize: 16, color: '#1B4332' }} />
                    : <TrendingDown sx={{ fontSize: 16, color: '#B91C1C' }} />
                  }
                  <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.up ? '#1B4332' : '#B91C1C' }}>
                    {kpi.trend}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Monthly Revenue Bar Chart (CSS-based) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Monthly Revenue</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180 }}>
              {monthlySales.map((m) => {
                const height = Math.round((m.revenue / maxRevenue) * 100);
                return (
                  <Box key={m.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B4332', fontSize: 11 }}>
                      ₹{(m.revenue / 1000).toFixed(1)}k
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: `${height}%`,
                        minHeight: 8,
                        background: m.month === 'Jun'
                          ? 'linear-gradient(180deg, #F59E0B, #D97706)'
                          : 'linear-gradient(180deg, #40916C, #1B4332)',
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.5s ease',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {m.month}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Category Breakdown */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Revenue by Category</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {topCategories.map((cat) => (
                <Box key={cat.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                        ₹{(cat.revenue / 1000).toFixed(0)}k
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cat.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cat.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#E7E5E4',
                      '& .MuiLinearProgress-bar': { bgcolor: cat.color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Monthly detail table */}
        <Grid size={12}>
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E7E5E4' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Monthly Breakdown</Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Avg. Order</TableCell>
                  <TableCell>Growth</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlySales.map((m, i) => {
                  const prev       = monthlySales[i - 1];
                  const growth     = prev ? (((m.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : null;
                  const growthUp   = growth === null ? null : parseFloat(growth) >= 0;
                  return (
                    <TableRow key={m.month}>
                      <TableCell sx={{ fontWeight: 700 }}>{m.month} 2026</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>₹{m.revenue.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{m.orders}</TableCell>
                      <TableCell>₹{Math.round(m.revenue / m.orders)}</TableCell>
                      <TableCell>
                        {growth !== null ? (
                          <Chip
                            label={`${growthUp ? '+' : ''}${growth}%`}
                            size="small"
                            sx={{
                              bgcolor: growthUp ? '#D8F3DC' : '#FEE2E2',
                              color: growthUp ? '#1B4332' : '#B91C1C',
                              fontWeight: 700, fontSize: 11, borderRadius: 1.5,
                            }}
                          />
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </AdminShell>
  );
}

