"use client";

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Mail, Phone, Calendar, Edit2, Trash2, UserPlus, X } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { GlassPanel } from '@/components/ui/glass-panel';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { TeamMember } from '@/lib/types';
import { toast } from "sonner";
import { supabaseClient } from '@/lib/supabase/client';
import { getMemberStats, MemberStats } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface EnrichedMember extends TeamMember {
  stats: MemberStats;
}

const AVATAR_COLORS = [
  { label: 'Blue',   value: 'blue',   class: 'bg-blue-500' },
  { label: 'Green',  value: 'green',  class: 'bg-green-500' },
  { label: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { label: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { label: 'Pink',   value: 'pink',   class: 'bg-pink-500' },
];

export default function TeamPage() {
  const [members, setMembers]             = useState<EnrichedMember[]>([]);
  const [loading, setLoading]             = useState(true);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [formData, setFormData]           = useState({
    name: '', email: '', role: '', phone: '', avatar_color: 'blue',
  });

  /* ─── Fetch ─────────────────────────────────────────────── */
  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token || '';
      const response = await fetch('/api/team', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();

      // Any API error → show empty state with Add Member button
      if (!response.ok || json?.error) {
        console.warn('Team fetch warning:', json?.error || response.statusText);
        setMembers([]);
        return;
      }

      const list: TeamMember[] = Array.isArray(json) ? json : [];

      const { data: tasks } = await supabaseClient
        .from('tasks')
        .select('id,title,description,status,priority,assignee,due_date,estimated_value,completed_at,deleted_at,created_at,updated_at');

      setMembers(
        list.map(m => ({ ...m, stats: getMemberStats(m.id, tasks || []) }))
      );
    } catch (err: any) {
      console.warn('fetchTeamMembers error:', err?.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeamMembers(); }, [fetchTeamMembers]);

  /* ─── Helpers ────────────────────────────────────────────── */
  const openAdd = () => {
    setEditingMember(null);
    setFormData({ name: '', email: '', role: '', phone: '', avatar_color: 'blue' });
    setIsModalOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setFormData({ name: m.name, email: m.email, role: m.role, phone: m.phone || '', avatar_color: m.avatar_color || 'blue' });
    setIsModalOpen(true);
  };

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';

  /* ─── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token  = (await supabaseClient.auth.getSession()).data.session?.access_token || '';
      const url    = editingMember ? `/api/team/${editingMember.id}` : '/api/team';
      const method = editingMember ? 'PATCH' : 'POST';

      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          joined_date: editingMember ? editingMember.joined_date : new Date().toISOString(),
        }),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      toast.success(editingMember ? 'Member updated' : 'Member added!');
      setIsModalOpen(false);
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed. Make sure Supabase RLS policies allow INSERT.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete ─────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token || '';
      const res   = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      toast.success('Member removed');
      setDeletingId(null);
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <PageContainer>

        {/* ── HEADER — Add Member button rendered directly, no parent component wrapping it ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Members</h1>
            <p className="text-muted-foreground mt-1.5 font-medium">
              Coordinate with your {members.length} team member{members.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <GlassPanel key={i} className="h-[280px] animate-pulse"><div /></GlassPanel>
            ))}
          </div>
        ) : members.length === 0 ? (
          <GlassPanel className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Click <strong>Add Member</strong> above to add your first team member.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add First Member
            </button>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <GlassPanel key={member.id} className="p-6 relative group transition-all hover:translate-y-[-4px]">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => openEdit(member)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setDeletingId(member.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6 pt-2">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/10 ${AVATAR_COLORS.find(c => c.value === member.avatar_color)?.class || 'bg-blue-500'}`}>
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">{member.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{member.role}</p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <a href={`mailto:${member.email}`} className="truncate hover:text-primary transition-colors">{member.email}</a>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <a href={`tel:${member.phone}`} className="hover:text-primary transition-colors">{member.phone}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Joined {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Tasks</p>
                    <p className="text-2xl font-black text-foreground">
                      {member.stats.completedTasks}
                      <span className="text-sm font-medium text-muted-foreground border-l border-border/50 pl-1 ml-1">{member.stats.assignedTasks}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Efficiency</p>
                    <p className="text-2xl font-black text-foreground">{member.stats.efficiencyRate}%</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 text-green-600/70 dark:text-green-400/70">Productivity Value</p>
                  <p className="text-lg font-black text-green-600 dark:text-green-400">{member.stats.productivityRevenue}</p>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}

        {/* ═══ ADD / EDIT MODAL ═══ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassPanel className="w-full max-w-lg p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingMember ? 'Edit Member' : 'Add Team Member'}</h2>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <AppInput label="Full Name" placeholder="e.g. Jane Doe" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                <AppInput label="Email Address" type="email" placeholder="jane@example.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                <AppInput label="Role / Title" placeholder="e.g. Senior Developer" value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })} required />
                <AppInput label="Phone (optional)" placeholder="+1 555 000 0000" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Avatar Color</label>
                  <div className="flex gap-3 px-1">
                    {AVATAR_COLORS.map(color => (
                      <button key={color.value} type="button"
                        onClick={() => setFormData({ ...formData, avatar_color: color.value })}
                        className={cn('w-8 h-8 rounded-full transition-all border-2', color.class,
                          formData.avatar_color === color.value
                            ? 'border-primary scale-110 shadow-lg ring-2 ring-primary/20'
                            : 'border-transparent opacity-70 hover:opacity-100')}
                        title={color.label} />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                    {submitting ? 'Saving…' : editingMember ? 'Update Member' : 'Add Member'}
                  </button>
                </div>
              </form>
            </GlassPanel>
          </div>
        )}

        {/* ═══ DELETE CONFIRMATION ═══ */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <GlassPanel className="w-full max-w-sm p-8 shadow-2xl text-center">
              <h2 className="text-xl font-bold text-red-500 mb-3">Remove Member?</h2>
              <p className="text-muted-foreground mb-6">This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button type="button" onClick={() => setDeletingId(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={() => handleDelete(deletingId)} disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                  {isDeleting ? 'Deleting…' : 'Delete Member'}
                </button>
              </div>
            </GlassPanel>
          </div>
        )}

      </PageContainer>
    </DashboardLayout>
  );
}
