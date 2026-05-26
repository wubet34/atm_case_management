

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
    phone VARCHAR(20) NOT NULL,
    district VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(20) UNIQUE NOT NULL,
    atm_name VARCHAR(100) NOT NULL,
    bank VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    comment TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Appointed', 'Ongoing', 'Completed', 'Terminated')),
    technician VARCHAR(100),
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    completed_at TIMESTAMP,
    terminated_at TIMESTAMP,
    termination_reason TEXT,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cases_case_id ON cases(case_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_technician_id ON cases(technician_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone, district, status)
VALUES (
    'Admin User',
    'admin@example.com',
    '$2a$10$rQsZq4QeGjZxQqQeGjZxQe', -- This is a placeholder, you'll need to generate proper hash
    'admin',
    '0911123456',
    'Addis Ababa',
    'Active'
) ON CONFLICT (email) DO NOTHING;

-- Technician Reports table
CREATE TABLE IF NOT EXISTS technician_reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    technician_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technician_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'archived')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for technician_reports
CREATE INDEX IF NOT EXISTS idx_tech_reports_technician_id ON technician_reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_tech_reports_status ON technician_reports(status);
CREATE INDEX IF NOT EXISTS idx_tech_reports_created_at ON technician_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_tech_reports_report_date ON technician_reports(report_date);

-- Add trigger for technician_reports updated_at
CREATE TRIGGER update_technician_reports_updated_at 
    BEFORE UPDATE ON technician_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();