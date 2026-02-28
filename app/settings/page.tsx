"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AppButton } from '@/components/ui/app-button';
import { Bell, Lock, Users, Database, ShieldAlert, History, Trash2 } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';

export default function SettingsPage() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    twoFactor: false,
  });

  const handleSettingChange = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleDangerAction = async (action: 'clear_data' | 'delete_account') => {
    const isDelete = action === 'delete_account';
    const confirmMsg = isDelete
      ? 'Are you absolutely sure you want to DELETE YOUR ACCOUNT? This cannot be undone.'
      : 'Are you sure you want to CLEAR ALL DATA? All your tasks, revenue, and logs will be deleted.';

    if (!window.confirm(confirmMsg)) return;

    setLoadingAction(action);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      if (isDelete) {
        await supabaseClient.auth.signOut();
        window.location.href = '/login';
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const settingGroups = [
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage how you receive alerts and updates',
      items: [
        { label: 'Push Notifications', key: 'notifications', description: 'Real-time task and system alerts' },
        { label: 'Email Alerts', key: 'emailAlerts', description: 'Daily summary and critical updates' },
      ],
    },
    {
      icon: Lock,
      title: 'Security',
      description: 'Protect your account and data',
      items: [
        { label: 'Two-Factor Authentication', key: 'twoFactor', description: 'Add an extra layer of security' },
      ],
    },
    {
      icon: Users,
      title: 'Team',
      description: 'Manage team members and permissions',
      items: [
        { label: 'Manage Team Members', action: true },
        { label: 'Set Team Permissions', action: true },
      ],
    },
    {
      icon: Database,
      title: 'Data',
      description: 'Control your data and backups',
      items: [
        { label: 'Export Data', action: true },
        { label: 'Download Backup', action: true },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="Settings" description="Manage your account preferences and system configuration" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingGroups.map((group) => {
            const Icon = group.icon;
            return (
              <GlassPanel key={group.title} className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        {'description' in item && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {'action' in item ? (
                        <AppButton variant="outline" size="sm">
                          Configure
                        </AppButton>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={'key' in item ? settings[item.key as keyof typeof settings] : false}
                            onChange={() => 'key' in item && handleSettingChange(item.key)}
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </GlassPanel>
            );
          })}

          <GlassPanel className="p-6 border-red-500/20 bg-red-500/5 lg:col-span-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Danger Zone</h2>
                <p className="text-sm text-red-800/70 dark:text-red-300/70">Destructive actions cannot be undone</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppButton
                variant="danger"
                className="w-full"
                onClick={() => handleDangerAction('clear_data')}
                loading={loadingAction === 'clear_data'}
              >
                <History className="w-4 h-4 mr-2" />
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

        <div className="flex gap-4 pt-4">
          <AppButton className="px-8">Save Changes</AppButton>
          <AppButton variant="outline">Reset to Defaults</AppButton>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
