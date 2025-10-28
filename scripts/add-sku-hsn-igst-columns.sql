-- Add sku, hsn_code, and igst columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS igst DECIMAL(10,2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_sku ON orders(sku);
CREATE INDEX IF NOT EXISTS idx_orders_hsn_code ON orders(hsn_code);
CREATE INDEX IF NOT EXISTS idx_orders_igst ON orders(igst);

-- Update existing records with sample data (optional)
-- This is just for testing purposes, you should update with real data
UPDATE orders SET 
    sku = CASE 
        WHEN order_id = 'ORD001' THEN 'SKU001'
        WHEN order_id = 'ORD002' THEN 'SKU002'
        WHEN order_id = 'ORD003' THEN 'SKU003'
        WHEN order_id = 'ORD004' THEN 'SKU004'
        WHEN order_id = 'ORD005' THEN 'SKU005'
        ELSE CONCAT('SKU', SUBSTRING(order_id, 4))
    END,
    hsn_code = CASE 
        WHEN order_id = 'ORD001' THEN 'HSN001'
        WHEN order_id = 'ORD002' THEN 'HSN002'
        WHEN order_id = 'ORD003' THEN 'HSN003'
        WHEN order_id = 'ORD004' THEN 'HSN004'
        WHEN order_id = 'ORD005' THEN 'HSN005'
        ELSE CONCAT('HSN', SUBSTRING(order_id, 4))
    END,
    igst = CASE 
        WHEN order_id = 'ORD001' THEN 18.00
        WHEN order_id = 'ORD002' THEN 12.00
        WHEN order_id = 'ORD003' THEN 5.00
        WHEN order_id = 'ORD004' THEN 28.00
        WHEN order_id = 'ORD005' THEN 18.00
        ELSE 18.00
    END
WHERE sku IS NULL OR hsn_code IS NULL OR igst IS NULL;