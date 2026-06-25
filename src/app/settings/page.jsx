'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput } from '@/components/ui';
import {
  Box, Paper, Typography, Button, Grid, Divider,
  Switch, FormControlLabel, Alert, Avatar, Tab, Tabs,
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAdmin } from '@/context/AdminContext';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function AdminSettingsPage() {
  const { state } = useAdmin();
  const [tab, setTab] = useState(0);

  const [profile, setProfile] = useState({
    name:  state.admin?.name  || '',
    email: state.admin?.email || '',
    phone: '',
  });

  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });

  const [siteSettings, setSiteSettings] = useState({
    siteName:           'Protine Web',
    supportEmail:       'support@protineweb.com',
    currency:           '₹ (INR)',
    maintenanceMode:    false,
    orderNotifications: true,
    lowStockAlert:      true,
    lowStockThreshold:  '10',
  });

  const handleProfileSave = () => { toast.success('✅ Profile updated successfully!'); };

  const handlePasswordSave = () => {
    if (!passwords.current || !passwords.newPwd || !passwords.confirm) { toast.error('Please fill all password fields.'); return; }
    if (passwords.newPwd !== passwords.confirm) { toast.error('New passwords do not match.'); return; }
    if (passwords.newPwd.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    toast.success('✅ Password changed successfully!');
    setPasswords({ current: '', newPwd: '', confirm: '' });
  };

  const handleSiteSettingsSave = () => { toast.success('✅ Site settings saved!'); };

  return (
    <AdminShell>
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E7E5E4', px: 3 }}>
          <Tab label="Profile" />
          <Tab label="Password" />
          <Tab label="Site Settings" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ── Profile Tab ── */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 30, fontWeight: 800 }}>
                {profile.name?.[0] || 'A'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{profile.name || 'Admin'}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {state.admin?.role?.name?.replace('_', ' ') || 'Admin'} · {profile.email}
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <Button variant="contained" startIcon={<Save />} onClick={handleProfileSave}
                  sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
                  Save Profile
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Password Tab ── */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={3} sx={{ maxWidth: 480 }}>
              <Grid size={12}>
                <TextInput
                  label="Current Password"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextInput
                  label="New Password"
                  type="password"
                  value={passwords.newPwd}
                  onChange={(e) => setPasswords({ ...passwords, newPwd: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextInput
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <Alert severity="info" sx={{ mb: 1, borderRadius: 2 }}>
                  Password must be at least 6 characters.
                </Alert>
                <Button variant="contained" startIcon={<Lock />} onClick={handlePasswordSave}
                  sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Site Settings Tab ── */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Site Name"
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Support Email"
                  value={siteSettings.supportEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Currency"
                  value={siteSettings.currency}
                  onChange={(e) => setSiteSettings({ ...siteSettings, currency: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextInput
                  label="Low Stock Alert Threshold"
                  value={siteSettings.lowStockThreshold}
                  onChange={(e) => {
                    // allow only digits via regex, no type="number"
                    const val = e.target.value.replace(/[^\d]/g, '');
                    setSiteSettings({ ...siteSettings, lowStockThreshold: val });
                  }}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Notifications & Toggles</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { key: 'orderNotifications', label: 'Email notifications for new orders' },
                    { key: 'lowStockAlert',       label: 'Low stock alerts' },
                    { key: 'maintenanceMode',     label: 'Maintenance mode (takes site offline)' },
                  ].map(({ key, label }) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Switch
                          checked={siteSettings[key]}
                          onChange={(e) => setSiteSettings({ ...siteSettings, [key]: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#40916C' } }}
                        />
                      }
                      label={label}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid size={12}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSiteSettingsSave}
                  sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
                  Save Settings
                </Button>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>
    </AdminShell>
  );
}
