"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { supabaseClient } from '@/lib/supabase/client';
import { Mail, Phone, Calendar } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar_color: string;
  joined_date: string;
  task_count: number;
  activity_count: number;
}

const supabase = supabaseClient;

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name');

      if (error) throw error;

      const enrichedMembers = await Promise.all(
        (data || []).map(async (member) => {
          const [tasksRes, activitiesRes] = await Promise.all([
            supabase.from('tasks').select('id').eq('assignee', member.name),
            supabase.from('activity_logs').select('id'),
          ]);

          return {
            ...member,
            task_count: tasksRes.data?.length || 0,
            activity_count: activitiesRes.data?.length || 0,
          };
        })
      );

      setMembers(enrichedMembers);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch team members:', error?.message);
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const avatarColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader 
          title="Team Members" 
          description={`Coordinate with your ${members.length} team members`}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <GlassPanel key={i} className="h-48 animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No team members found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <GlassPanel key={member.id} className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${avatarColors[member.avatar_color as keyof typeof avatarColors] || 'bg-blue-500'}`}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${member.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {member.email}
                    </a>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${member.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {member.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Joined {new Date(member.joined_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Tasks</p>
                    <p className="text-xl font-bold text-foreground">{member.task_count}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Activities</p>
                    <p className="text-xl font-bold text-foreground">{member.activity_count}</p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
