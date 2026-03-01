"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AppButton } from '@/components/ui/app-button';
import { Bell, Lock, Users, Database, ShieldAlert, Save, RotateCcw, Download, Trash2, ExternalLink } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';
import { toast } from 'sonner';

const SETTINGS_KEY = 'flowtrack_settings';

const DEFAULT_SETTINGS = {
  notifications: true,
  emailAlerts: true,
  twoFactor: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [userEmail, setUserEmail] = useState('');

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch { }

    // Get current user email
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session?.user.email) setUserEmail(data.session.user.email);
    });
  }, []);

  const toggle = (key: keyof typeof DEFAULT_SETTINGS) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSaved(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save settings.');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    toast.success('Settings reset to defaults.');
    setSaved(false);
  };

  const handleExportData = async () => {
    setLoadingAction('export');
    try {
      const [tasksRes, teamRes] = await Promise.all([
        supabaseClient.from('tasks').select('*'),
        supabaseClient.from('team_members').select('*'),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        tasks: tasksRes.data || [],
        team_members: teamRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowtrack-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDangerAction = async (action: 'clear_data' | 'delete_account') => {
    const isDelete = action === 'delete_account';
    const confirmMsg = isDelete
      ? 'Are you absolutely sure you want to DELETE YOUR ACCOUNT? This cannot be undone.'
      : 'Are you sure you want to CLEAR ALL DATA? All your tasks and logs will be deleted.';

    if (!window.confirm(confirmMsg)) return;

    setLoadingAction(action);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      if (isDelete) {
        await supabaseClient.auth.signOut();
        router.push('/login');
      } else {
        toast.success('All data cleared.');
        window.location.reload();
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  /* ─── Toggle Row ─────────────────────────────────────────── */
  const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
  }: { label: string; description: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  /* ─── Action Row ─────────────────────────────────────────── */
  const ActionRow = ({
    label,
    description,
    buttonLabel,
    loading,
    onClick,
    icon: Icon,
  }: { label: string; description?: string; buttonLabel: string; loading?: boolean; onClick: () => void; icon?: any }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <AppButton variant="outline" size="sm" onClick={onClick} loading={loading}>
        {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
        {buttonLabel}
      </AppButton>
    </div>
  );

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Settings"
          description="Manage your account preferences"
          actions={
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/40">
              {userEmail}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Notifications ──────────────────────────────── */}
          <GlassPanel className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-lg bg-primary/10"><Bell className="w-5 h-5 text-primary" /></div>
              <div>
                <h2 className="text-base font-semibold">Notifications</h2>
                <p className="text-xs text-muted-foreground">Manage how you receive alerts</p>
              </div>
            </div>
            <div className="space-y-3">
              <ToggleRow
                label="Push Notifications"
                description="Real-time task and system alerts"
                checked={settings.notifications}
                onChange={() => toggle('notifications')}
              />
              <ToggleRow
                label="Email Alerts"
                description="Daily summary and critical updates"
                checked={settings.emailAlerts}
                onChange={() => toggle('emailAlerts')}
              />
            </div>
          </GlassPanel>

          {/* ── Security ───────────────────────────────────── */}
          <GlassPanel className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-lg bg-primary/10"><Lock className="w-5 h-5 text-primary" /></div>
              <div>
                <h2 className="text-base font-semibold">Security</h2>
                <p className="text-xs text-muted-foreground">Protect your account and data</p>
              </div>
            </div>
            <div className="space-y-3">
              <ToggleRow
                label="Two-Factor Authentication"
                description="Add an extra layer of security (UI preference only)"
                checked={settings.twoFactor}
                onChange={() => toggle('twoFactor')}
              />
            </div>
          </GlassPanel>

          {/* ── Team ───────────────────────────────────────── */}
          <GlassPanel className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
              <div>
                <h2 className="text-base font-semibold">Team</h2>
                <p className="text-xs text-muted-foreground">Manage team members and permissions</p>
              </div>
            </div>
            <div className="space-y-3">
              <ActionRow
                label="Manage Team Members"
                description="Add, edit or remove team members"
                buttonLabel="Go to Team"
                icon={ExternalLink}
                onClick={() => router.push('/team')}
              />
              <ActionRow
                label="Team Permissions"
                description="Role-based access is set when adding members (admin / member)"
                buttonLabel="Go to Team"
                icon={ExternalLink}
                onClick={() => router.push('/team')}
              />
            </div>
          </GlassPanel>

          {/* ── Data ───────────────────────────────────────── */}
          <GlassPanel className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-lg bg-primary/10"><Database className="w-5 h-5 text-primary" /></div>
              <div>
                <h2 className="text-base font-semibold">Data</h2>
                <p className="text-xs text-muted-foreground">Export and back up your data</p>
              </div>
            </div>
            <div className="space-y-3">
              <ActionRow
                label="Export Data"
                description="Download all your tasks and team data as JSON"
                buttonLabel="Export JSON"
                loading={loadingAction === 'export'}
                icon={Download}
                onClick={handleExportData}
              />
              <ActionRow
                label="Download Backup"
                description="Same as export — full JSON backup of all records"
                buttonLabel="Download"
                loading={loadingAction === 'export'}
                icon={Download}
                onClick={handleExportData}
              />
            </div>
          </GlassPanel>

          {/* ── Danger Zone ────────────────────────────────── */}
          <GlassPanel className="p-6 border-red-500/20 bg-red-500/5 lg:col-span-2">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-lg bg-red-500/10"><ShieldAlert className="w-5 h-5 text-red-500" /></div>
              <div>
                <h2 className="text-base font-semibold text-red-900 dark:text-red-200">Danger Zone</h2>
                <p className="text-xs text-red-800/70 dark:text-red-300/70">Destructive actions cannot be undone</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppButton
                variant="danger"
                className="w-full"
                onClick={() => handleDangerAction('clear_data')}
                loading={loadingAction === 'clear_data'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </AppButton>
              <AppButton
                variant="danger"
                className="w-full"
                onClick={() => handleDangerAction('delete_account')}
                loading={loadingAction === 'delete_account'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </AppButton>
            </div>
          </GlassPanel>

        </div>

        {/* ── Footer buttons ───────────────────────────────── */}
        <div className="flex gap-4 pt-4">
          <AppButton onClick={handleSave} className="px-8">
            <Save className="w-4 h-4 mr-2" />
            {saved ? 'Saved ✓' : 'Save Changes'}
          </AppButton>
          <AppButton variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </AppButton>
        </div>

      </PageContainer>
    </DashboardLayout>
  );
}
