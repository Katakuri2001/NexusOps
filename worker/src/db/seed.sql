-- NexusOps Seed Data

-- PBKDF2 password hashes (100000 iterations, SHA-256)
-- admin123
-- customer123
-- tech123

INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES
('usr_owner1', 'admin@nexusops.com', 'c286362b262f999db40b5b589d24105e:42580bda21ede74ca65f077f640736eb47d908853a00f0f88077771d4f68e409', 'System Owner', 'OWNER'),
('usr_cust1', 'john@example.com', '54267a86a1b4033c6ccaee1ffa004055:da9263550cff5aa97d82c1e34b0f8d30f570b51b97210b48708f649a974843a8', 'John Smith', 'CUSTOMER'),
('usr_tech1', 'mike@nexusops.com', '753346815cea2b5e005cd5b4adc5d632:23186803d152476a9cf8a5e5b89b13159ddb899cf73350e296c77809aba1a6c5', 'Mike Johnson', 'TECHNICIAN');

INSERT OR IGNORE INTO customers (id, user_id, phone, company, address) VALUES
('cust1', 'usr_cust1', '+1 555-0123', 'Smith Enterprises', '123 Main St, New York, NY');

INSERT OR IGNORE INTO technicians (id, user_id, specialization) VALUES
('tech1', 'usr_tech1', 'Full Stack Development');

INSERT OR IGNORE INTO websites (id, name, domain, description, developer_name, status, website_type, launch_date, customer_id) VALUES
('web1', 'Smith Enterprises', 'smith-enterprises.com', 'Corporate website for Smith Enterprises', 'Jane Smith', 'OPERATIONAL', 'Business', '2025-01-15', 'cust1'),
('web2', 'E-Commerce Store', 'smith-shop.com', 'Online store for Smith Enterprises', 'Dev Team', 'MAINTENANCE', 'E-Commerce', '2025-06-01', 'cust1'),
('web3', 'Blog Platform', 'smith-blog.com', 'Company blog and news platform', NULL, 'ATTENTION_REQUIRED', 'Blog', '2025-03-20', 'cust1');

INSERT OR IGNORE INTO plans (id, website_id, name, description, price, billing_cycle, features, start_date, renewal_date) VALUES
('plan1', 'web1', 'Professional', 'Full service website management', 99.0, 'monthly', '["Website hosting","Database","SSL","Maintenance","Technical support"]', '2025-01-15', '2026-01-15'),
('plan2', 'web2', 'Business', 'E-commerce ready hosting', 199.0, 'monthly', '["Website hosting","Database","SSL","CDN","Priority support"]', '2025-06-01', '2026-06-01');

INSERT OR IGNORE INTO hosting_services (id, website_id, provider, status, cost, billing_cycle, start_date, due_date) VALUES
('host1', 'web1', 'Cloud Hosting', 'active', 25.0, 'monthly', '2025-01-15', '2026-10-01'),
('host2', 'web2', 'AWS', 'active', 45.0, 'monthly', '2025-06-01', '2026-09-15');

INSERT OR IGNORE INTO database_services (id, website_id, provider, status, monthly_cost, billing_cycle, start_date, due_date) VALUES
('db1', 'web1', 'PostgreSQL', 'active', 15.0, 'monthly', '2025-01-15', '2026-10-01');

INSERT OR IGNORE INTO server_services (id, website_id, provider, status, plan, cost, billing_cycle, start_date, due_date) VALUES
('srv1', 'web1', 'DigitalOcean', 'operational', '2 vCPU / 4 GB RAM', 25.0, 'monthly', '2025-01-15', '2026-10-01');

INSERT OR IGNORE INTO notifications (id, website_id, customer_id, title, message, type, priority) VALUES
('notif1', 'web2', 'cust1', 'Maintenance in progress', 'E-commerce store is currently under maintenance. Expected completion by 5:00 PM.', 'MAINTENANCE', 'IMPORTANT'),
('notif2', 'web3', 'cust1', 'Attention needed', 'Blog platform has detected unusual traffic patterns. Please review.', 'WARNING', 'URGENT'),
('notif3', 'web1', 'cust1', 'Hosting renewal reminder', 'Your hosting service will be due for renewal in 30 days.', 'BILLING', 'NORMAL');

INSERT OR IGNORE INTO technician_website_assignments (id, technician_id, website_id) VALUES
('twa1', 'tech1', 'web1'),
('twa2', 'tech1', 'web2');

INSERT OR IGNORE INTO technician_permissions (id, technician_id, website_id, permission) VALUES
('tp1', 'tech1', 'web1', 'VIEW_WEBSITE'),
('tp2', 'tech1', 'web1', 'VIEW_STATUS'),
('tp3', 'tech1', 'web1', 'VIEW_TECHNICAL_INFO'),
('tp4', 'tech1', 'web1', 'CREATE_MAINTENANCE'),
('tp5', 'tech1', 'web2', 'VIEW_WEBSITE'),
('tp6', 'tech1', 'web2', 'VIEW_STATUS');

INSERT OR IGNORE INTO additional_charges (id, website_id, description, amount, date, billing_type, status) VALUES
('ch1', 'web1', 'SSL Certificate Renewal', 50.0, '2026-03-15', 'ONE_TIME', 'paid'),
('ch2', 'web2', 'Extra Storage', 10.0, '2026-09-01', 'MONTHLY', 'pending');

INSERT OR IGNORE INTO website_timeline (id, website_id, title, description, icon) VALUES
('tl1', 'web1', 'Website launched', 'Initial website deployment completed', 'rocket'),
('tl2', 'web1', 'Hosting renewed', 'Hosting service renewed for another year', 'server'),
('tl3', 'web1', 'Maintenance completed', 'Monthly security update applied', 'check');

INSERT OR IGNORE INTO maintenance_records (id, website_id, title, description, items, status, created_by_id) VALUES
('mt1', 'web1', 'Monthly security update', 'Applied all security patches and updated dependencies', '["Security updates","Dependency updates","Performance check","Backup verification"]', 'completed', 'usr_owner1');
