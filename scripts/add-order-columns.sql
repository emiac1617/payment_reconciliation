-- Add shipped_order_number and transaction_type columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_order_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) DEFAULT 'pending';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_shipped_order_number ON orders(shipped_order_number);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_type ON orders(transaction_type);

-- Update existing records with sample data (optional)
UPDATE orders SET 
    shipped_order_number = CASE 
        WHEN order_id = 'ORD001' THEN 'SHIP001'
        WHEN order_id = 'ORD002' THEN 'SHIP002'
        WHEN order_id = 'ORD003' THEN 'SHIP003'
        WHEN order_id = 'ORD004' THEN 'SHIP004'
        WHEN order_id = 'ORD005' THEN 'SHIP005'
        ELSE CONCAT('SHIP', SUBSTRING(order_id, 4))
    END,
    transaction_type = CASE 
        WHEN payment_status = 'paid' THEN 'completed'
        WHEN payment_status = 'pending' THEN 'processing'
        ELSE 'pending'
    END
WHERE shipped_order_number IS NULL OR transaction_type = 'pending';