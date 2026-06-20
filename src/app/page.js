'use client';

import AdminShell from '@/components/AdminShell';
import {
  Box, Grid, Paper, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Avatar, LinearProgress,
} from '@mui/material';
import {
  TrendingUp, ShoppingCart, People, Inventory,
  AttachMoney, ArrowUpward, ArrowDownward,
} from '@mui/icons-material';

// ── Mock data ──────────────────────────────────────────────────────────────────
const stats = [
  {
    label:    'Total Revenue',
    value:    '₹4,82,350',
    change:   '+12.5%',
    up:       true,
    icon:     <AttachMoney sx={{ fontSize: 28 }} />,
    color:    '#1B4332',
    bg:       '#D8F3DC',
  },
  {
    label:    'Total Orders',
    value:    '1,284',
    change:   '+8.2%',
    up:       true,
    icon:     <ShoppingCart sx={{ fontSize: 28 }} />,
    color:    '#0369A1',
    bg:       '#E0F2FE',
  },
  {
    label:    'Total Users',
    value:    '3,941',
    change:   '+5.1%',
    up:       true,
    icon:     <People sx={{ fontSize: 28 }} />,
    color:    '#7C3AED',
    bg:       '#EDE9FE',
  },
  {
    label:    'Products',
    value:    '48',
    change:   '-2',
    up:       false,
    icon:     <Inventory sx={{ fontSize: 28 }} />,
    color:    '#D97706',
    bg:       '#FEF3C7',
  },
];

const recentOrders = [
  { id: '#ORD-1092', customer: 'Rahul Sharma',  product: 'Classic Ketchup',   amount: '₹599',  status: 'Delivered', date: '21 Jun 2026' },
  { id: '#ORD-1091', customer: 'Priya Mehta',   product: 'Garlic Mayo',       amount: '₹399',  status: 'Pending',   date: '21 Jun 2026' },
  { id: '#ORD-1090', customer: 'Amit Kumar',    product: 'Smoky BBQ Sauce',   amount: '₹299',  status: 'Shipped',   date: '20 Jun 2026' },
  { id: '#ORD-1089', customer: 'Sneha Patel',   product: 'Honey Mustard',     amount: '₹449',  status: 'Processing',date: '20 Jun 2026' },
  { id: '#ORD-1088', customer: 'Ravi Verma',    product: 'Spicy Chilli',      amount: '₹249',  status: 'Cancelled', date: '19 Jun 2026' },
];

const topProducts = [
  { name: 'Smoky BBQ Sauce',      sales: 445, revenue: '₹70,755', progress: 89 },
  { name: 'Classic Tomato Ketchup', sales: 234, revenue: '₹34,866', progress: 68 },
  { name: 'Spicy Chilli Sauce',   sales: 312, revenue: '₹40,248', progress: 75 },
  { name: 'Schezwan Sauce',       sales: 267, revenue: '₹37,113', progress: 60 },
  { name: 'Garlic Mayonnaise',    sales: 189, revenue: '₹37,611', progress: 42 },
];

const statusColors = {
  Delivered:  { bgcolor: '#D8F3DC', color: '#1B4332' },
  Pending:    { bgcolor: '#FEF3C7', color: '#92400E' },
  Shipped:    { bgcolor: '#E0F2FE', color: '#0369A1' },
  Processing: { bgcolor: '#EDE9FE', color: '#7C3AED' },
  Cancelled:  { bgcolor: '#FEE2E2', color: '#B91C1C' },
};

function StatCard({ stat }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
              {stat.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1C1917', mb: 1 }}>
              {stat.value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {stat.up
                ? <ArrowUpward sx={{ fontSize: 16, color: '#1B4332' }} />
                : <ArrowDownward sx={{ fontSize: 16, color: '#B91C1C' }} />
              }
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: stat.up ? '#1B4332' : '#B91C1C' }}
              >
                {stat.change}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                vs last month
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 2.5,
              bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color,
            }}
          >
            {stat.icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.label}>
            <StatCard stat={stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E7E5E4' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Orders</Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{order.id}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{order.customer}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{order.product}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{order.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          sx={{
                            ...statusColors[order.status],
                            fontWeight: 700,
                            fontSize: 11,
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', height: '100%' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E7E5E4' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Top Products</Typography>
            </Box>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {topProducts.map((p, i) => (
                <Box key={p.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 30, height: 30, fontSize: 12, fontWeight: 800,
                          bgcolor: i % 2 === 0 ? '#1B4332' : '#F59E0B',
                          color: i % 2 === 0 ? '#FFF8F0' : '#1C1917',
                        }}
                      >
                        {i + 1}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                        {p.name}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{p.revenue}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.sales} sold</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={p.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#E7E5E4',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: i % 2 === 0 ? '#1B4332' : '#F59E0B',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </AdminShell>
  );
}

