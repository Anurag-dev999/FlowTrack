-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create revenue table
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url VARCHAR(500),
  role VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample team members
INSERT INTO team_members (name, email, role, avatar_url) VALUES
  ('Alice Johnson', 'alice@flowtrack.com', 'Product Manager', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
  ('Bob Smith', 'bob@flowtrack.com', 'Lead Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'),
  ('Carol Williams', 'carol@flowtrack.com', 'Designer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol'),
  ('David Brown', 'david@flowtrack.com', 'QA Engineer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'),
  ('Eva Davis', 'eva@flowtrack.com', 'DevOps Engineer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva'),
  ('Frank Miller', 'frank@flowtrack.com', 'Business Analyst', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank')
ON CONFLICT DO NOTHING;

-- Insert sample revenue data (12 months)
INSERT INTO revenue (month, amount) VALUES
  ('2024-01-01', 45000.00),
  ('2024-02-01', 52000.00),
  ('2024-03-01', 48000.00),
  ('2024-04-01', 61000.00),
  ('2024-05-01', 58000.00),
  ('2024-06-01', 65000.00),
  ('2024-07-01', 72000.00),
  ('2024-08-01', 68000.00),
  ('2024-09-01', 75000.00),
  ('2024-10-01', 82000.00),
  ('2024-11-01', 88000.00),
  ('2024-12-01', 95000.00)
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, assigned_to, due_date) VALUES
  ('Design new dashboard layout', 'Create modern dashboard with charts and metrics', 'completed', 'high', NULL, '2024-01-15'),
  ('Implement user authentication', 'Setup OAuth2 and session management', 'in-progress', 'high', NULL, '2024-02-01'),
  ('Create API documentation', 'Write comprehensive API docs with examples', 'todo', 'medium', NULL, '2024-02-15'),
  ('Setup CI/CD pipeline', 'Configure GitHub Actions for automated testing', 'in-progress', 'high', NULL, '2024-02-10'),
  ('Database optimization', 'Add indexes and optimize queries', 'todo', 'medium', NULL, '2024-03-01'),
  ('Create landing page', 'Design and implement marketing landing page', 'completed', 'medium', NULL, '2024-01-20'),
  ('Setup monitoring and alerts', 'Configure Sentry and logging system', 'todo', 'high', NULL, '2024-02-20'),
  ('Write unit tests', 'Add test coverage for core modules', 'in-progress', 'medium', NULL, '2024-02-25'),
  ('Implement dark mode', 'Add dark theme support to application', 'todo', 'low', NULL, '2024-03-10'),
  ('Create admin panel', 'Build admin dashboard for management', 'todo', 'high', NULL, '2024-03-15'),
  ('Email notifications', 'Setup email service for user notifications', 'todo', 'medium', NULL, '2024-03-05'),
  ('Performance optimization', 'Optimize bundle size and page load time', 'in-progress', 'high', NULL, '2024-03-20'),
  ('User analytics tracking', 'Implement analytics dashboard', 'todo', 'medium', NULL, '2024-03-25'),
  ('Security audit', 'Conduct security review and fix vulnerabilities', 'todo', 'high', NULL, '2024-03-30'),
  ('Mobile app design', 'Design mobile version of application', 'todo', 'low', NULL, '2024-04-15'),
  ('API rate limiting', 'Implement rate limiting for API endpoints', 'todo', 'medium', NULL, '2024-03-08'),
  ('Database backup strategy', 'Setup automated daily backups', 'completed', 'high', NULL, '2024-01-10'),
  ('Create user onboarding flow', 'Build guided tour for new users', 'in-progress', 'high', NULL, '2024-02-28'),
  ('Integration testing', 'Create integration tests for main features', 'todo', 'medium', NULL, '2024-03-12'),
  ('Documentation website', 'Build interactive documentation site', 'todo', 'low', NULL, '2024-04-10'),
  ('Implement webhooks', 'Add webhook support for integrations', 'todo', 'medium', NULL, '2024-03-18'),
  ('Customer feedback system', 'Build in-app feedback collection', 'todo', 'low', NULL, '2024-04-01'),
  ('Performance monitoring', 'Setup real-time monitoring dashboard', 'in-progress', 'high', NULL, '2024-03-22'),
  ('Accessibility improvements', 'Ensure WCAG 2.1 AA compliance', 'todo', 'high', NULL, '2024-04-05'),
  ('Multi-language support', 'Add i18n for multiple languages', 'todo', 'low', NULL, '2024-04-20'),
  ('API versioning strategy', 'Plan and implement API versioning', 'todo', 'medium', NULL, '2024-03-28'),
  ('Create roadmap page', 'Build public product roadmap', 'todo', 'low', NULL, '2024-04-25'),
  ('Implement caching', 'Add Redis caching for performance', 'in-progress', 'high', NULL, '2024-03-19'),
  ('User permission system', 'Implement role-based access control', 'todo', 'high', NULL, '2024-04-02'),
  ('Create blog platform', 'Setup blog for company updates', 'todo', 'low', NULL, '2024-05-01'),
  ('Advanced search', 'Implement full-text search capability', 'todo', 'medium', NULL, '2024-04-08'),
  ('Notification system', 'Build real-time notification system', 'in-progress', 'high', NULL, '2024-03-26'),
  ('Data export feature', 'Allow users to export their data', 'todo', 'medium', NULL, '2024-04-12'),
  ('Load balancing setup', 'Configure load balancing for scaling', 'todo', 'high', NULL, '2024-04-18'),
  ('API error handling', 'Improve error messages and handling', 'todo', 'medium', NULL, '2024-04-15'),
  ('Feature flags implementation', 'Add feature flag system for rollouts', 'todo', 'medium', NULL, '2024-04-10'),
  ('Database migration tool', 'Create migration tool for schema updates', 'todo', 'medium', NULL, '2024-04-22'),
  ('Billing system', 'Implement subscription and billing', 'todo', 'high', NULL, '2024-05-05'),
  ('Third-party integrations', 'Add Slack, Teams, etc integrations', 'todo', 'low', NULL, '2024-05-10'),
  ('Advanced reporting', 'Create detailed reports and analytics', 'todo', 'medium', NULL, '2024-05-15')
ON CONFLICT DO NOTHING;

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES
  (NULL, 'created', 'task', NULL, '{"title": "Design new dashboard layout"}'),
  (NULL, 'updated', 'task', NULL, '{"status": "in-progress"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Implement user authentication"}'),
  (NULL, 'updated', 'task', NULL, '{"status": "completed"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Setup CI/CD pipeline"}'),
  (NULL, 'updated', 'revenue', NULL, '{"month": "2024-01-01", "amount": 45000}'),
  (NULL, 'created', 'task', NULL, '{"title": "Create landing page"}'),
  (NULL, 'deleted', 'task', NULL, '{"title": "Deprecated feature"}'),
  (NULL, 'updated', 'task', NULL, '{"priority": "high"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Database optimization"}'),
  (NULL, 'updated', 'task', NULL, '{"status": "in-progress"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Write unit tests"}'),
  (NULL, 'updated', 'revenue', NULL, '{"month": "2024-02-01", "amount": 52000}'),
  (NULL, 'created', 'task', NULL, '{"title": "Implement dark mode"}'),
  (NULL, 'updated', 'task', NULL, '{"assigned_to": "alice@flowtrack.com"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Create admin panel"}'),
  (NULL, 'updated', 'task', NULL, '{"due_date": "2024-02-20"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Email notifications"}'),
  (NULL, 'updated', 'task', NULL, '{"status": "completed"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Performance optimization"}'),
  (NULL, 'updated', 'revenue', NULL, '{"month": "2024-03-01", "amount": 48000}'),
  (NULL, 'created', 'task', NULL, '{"title": "User analytics tracking"}'),
  (NULL, 'updated', 'task', NULL, '{"priority": "medium"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Security audit"}'),
  (NULL, 'updated', 'task', NULL, '{"status": "in-progress"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Mobile app design"}'),
  (NULL, 'updated', 'revenue', NULL, '{"month": "2024-04-01", "amount": 61000}'),
  (NULL, 'created', 'task', NULL, '{"title": "API rate limiting"}'),
  (NULL, 'updated', 'task', NULL, '{"assigned_to": "bob@flowtrack.com"}'),
  (NULL, 'created', 'task', NULL, '{"title": "Create user onboarding flow"}')
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security) for future use
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
