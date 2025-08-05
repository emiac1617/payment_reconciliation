-- Add reconciliation columns to the existing orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS adjusted_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remark TEXT DEFAULT '';

-- Update existing records to have default values
UPDATE orders 
SET adjusted_amount = 0 
WHERE adjusted_amount IS NULL;

UPDATE orders 
SET remark = '' 
WHERE remark IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.adjusted_amount IS 'Manual adjustment amount for reconciliation purposes';
COMMENT ON COLUMN orders.remark IS 'Reconciliation notes and remarks';
