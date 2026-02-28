"use client";

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Mail, Phone, Calendar, Plus, Edit2, Trash2, UserPlus, MoreVertical, X } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMember } from '@/lib/types';
import { toast } from "sonner";
import { supabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface EnrichedMember extends TeamMember {
  task_count: number;
  activity_count: number;
}

const AVATAR_COLORS = [
  { label: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { label: 'Green', value: 'green', class: 'bg-green-500' },
  { label: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { label: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { label: 'Pink', value: 'pink', class: 'bg-pink-500' },
];

export default function TeamPage() {
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    avatar_color: 'blue',
  });

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/team', {
        headers: {
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token || ''}`
        }
      });
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Simple enrichment - in a real app, use a join or view
      const enrichedMembers = await Promise.all(
        (data || []).map(async (member: TeamMember) => {
          const { count: taskCount } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assignee', member.name);

          const { count: activityCount } = await supabaseClient
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', member.id);

          return {
            ...member,
            task_count: taskCount || 0,
            activity_count: activityCount || 0,
          };
        })
      );

      setMembers(enrichedMembers);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      phone: '',
      avatar_color: 'blue',
    });
    setEditingMember(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone || '',
      avatar_color: member.avatar_color || 'blue',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const session = (await supabaseClient.auth.getSession()).data.session;
      const url = editingMember ? `/api/team/${editingMember.id}` : '/api/team';
      const method = editingMember ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          ...formData,
          joined_date: editingMember ? editingMember.joined_date : new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success(editingMember ? 'Member updated' : 'Member added');
      setIsModalOpen(false);
      fetchTeamMembers();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const session = (await supabaseClient.auth.getSession()).data.session;
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Member removed');
      setDeletingId(null);
      fetchTeamMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <PageHeader
            title="Team Members"
            description={`Coordinate with your ${members.length} team members`}
            className="mb-0"
          />
          <AppButton onClick={handleOpenAddModal} className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </AppButton>
        </div>

        {loading && members.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
              Start building your high-performance team by adding your first member.
            </p>
            <AppButton onClick={handleOpenAddModal} variant="outline">
              Add First Member
            </AppButton>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <GlassPanel key={member.id} className="p-6 relative group transition-all hover:translate-y-[-4px]">
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(member.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
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
                    <a href={`mailto:${member.email}`} className="truncate hover:text-primary transition-colors">
                      {member.email}
                    </a>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <a href={`tel:${member.phone}`} className="hover:text-primary transition-colors">
                        {member.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Joined {new Date(member.joined_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Total Tasks</p>
                    <p className="text-2xl font-black text-foreground">{member.task_count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Activities</p>
                    <p className="text-2xl font-black text-foreground">{member.activity_count}</p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <AppInput
                label="Full Name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <AppInput
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <AppInput
                label="Role"
                placeholder="e.g. Senior Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              />
              <AppInput
                label="Phone Number (Optional)"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Avatar Color</label>
                <div className="flex gap-3 px-1">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar_color: color.value })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all border-2",
                        color.class,
                        formData.avatar_color === color.value
                          ? "border-primary scale-110 shadow-lg ring-2 ring-primary/20"
                          : "border-transparent opacity-70 hover:opacity-100"
                      )}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter className="mt-6">
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  loading={submitting}
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </AppButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-500">Remove Member?</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-muted-foreground">
              Are you sure you want to remove this team member? This action cannot be undone.
            </div>
            <DialogFooter>
              <AppButton variant="ghost" onClick={() => setDeletingId(null)}>
                Cancel
              </AppButton>
              <AppButton
                variant="danger"
                onClick={() => deletingId && handleDelete(deletingId)}
                loading={isDeleting}
              >
                Delete Member
              </AppButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </DashboardLayout>
  );
}
