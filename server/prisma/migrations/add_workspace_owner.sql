-- Migration to add owner support to workspaces
-- This migration adds ownerId column to workspaces table and sets existing workspaces to the first admin user

-- Add ownerId column to workspaces table
ALTER TABLE workspaces ADD COLUMN ownerId INTEGER;

-- Set existing workspaces to be owned by the first admin user (if any)
UPDATE workspaces 
SET ownerId = (
  SELECT id 
  FROM users 
  WHERE role = 'admin' 
  ORDER BY id ASC 
  LIMIT 1
)
WHERE ownerId IS NULL;

-- If no admin user exists, set to first user
UPDATE workspaces 
SET ownerId = (
  SELECT id 
  FROM users 
  ORDER BY id ASC 
  LIMIT 1
)
WHERE ownerId IS NULL;