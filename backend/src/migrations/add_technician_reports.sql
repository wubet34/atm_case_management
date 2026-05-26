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
DROP TRIGGER IF EXISTS update_technician_reports_updated_at ON technician_reports;
CREATE TRIGGER update_technician_reports_updated_at 
    BEFORE UPDATE ON technician_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 'technician_reports table created successfully' as status;