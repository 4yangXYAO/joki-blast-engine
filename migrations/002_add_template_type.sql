-- 002_add_template_type.sql
BEGIN;

-- Add 'type' column to templates for template categorization
ALTER TABLE templates ADD COLUMN type TEXT DEFAULT 'template';

COMMIT;
