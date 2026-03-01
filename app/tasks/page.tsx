"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Plus, Trash2, Loader2, User } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';

const TASK_FIELDS =
  'id,title,description,status,priority,assignee,due_date,estimated_value,completed_at,deleted_at,created_at,updated_at';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in_progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignee: '',
    due_date: new Date().toISOString(),
    estimated_value: 10,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabaseClient
      .from('tasks')
      .select(TASK_FIELDS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(
        data.map((t: any) => ({
          ...t,
          estimated_value: t.estimated_value ?? 10,
        }))
      );
    }
    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabaseClient
      .from('tasks')
      .insert([
        {
          ...newTask,
          completed_at: null,
        },
      ])
      .select(TASK_FIELDS);

    if (!error && data) {
      setTasks([data[0], ...tasks]);
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        due_date: new Date().toISOString(),
        estimated_value: 10,
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabaseClient.from('tasks').delete().eq('id', id);
    if (!error) setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleStatusChange = async (id: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    const updates: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    const { data, error } = await supabaseClient
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(TASK_FIELDS);

    if (!error && data) {
      setTasks(tasks.map((t) => (t.id === id ? { ...t, ...data[0], estimated_value: data[0].estimated_value ?? t.estimated_value } : t)));
    }
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-slate-500/10 text-slate-500',
    in_progress: 'bg-blue-500/10 text-blue-500',
    completed: 'bg-green-500/10 text-green-500',
  };

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Tasks"
          description="Manage and track your team's assignments"
          actions={
            <AppButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </AppButton>
          }
        />

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <GlassPanel className="p-12 text-center">
              <p className="text-muted-foreground">
                No tasks found. Create one to get started.
              </p>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <GlassPanel key={task.id} className="p-6 transition-all hover:scale-[1.01]">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${task.priority === 'high'
                        ? 'bg-red-500/10 text-red-500'
                        : task.priority === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-blue-500/10 text-blue-500'
                        }`}
                    >
                      {task.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {task.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mb-4">
                    Value: <span className="font-semibold text-foreground/70">{task.estimated_value ?? 10}</span>
                  </p>

                  {/* Status selector */}
                  <div className="mb-4">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task.id, e.target.value as 'todo' | 'in_progress' | 'completed')
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors ${statusColors[task.status] || ''
                        }`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {task.assignee}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[task.status] || ''
                        }`}
                    >
                      {statusLabels[task.status] || task.status}
                    </span>
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassPanel className="w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <AppInput
                label="Task Title"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <AppInput
                label="Description"
                placeholder="Provide more context..."
                multiline
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <AppInput
                  label="Assignee"
                  placeholder="Name"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">
                    Priority
                  </label>
                  <select
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as 'low' | 'medium' | 'high',
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">
                    Estimated Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={newTask.estimated_value}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        estimated_value: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">
                    Status
                  </label>
                  <select
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        status: e.target.value as 'todo' | 'in_progress' | 'completed',
                      })
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <AppButton
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancel
                </AppButton>
                <AppButton type="submit">Create Task</AppButton>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </DashboardLayout>
  );
}
