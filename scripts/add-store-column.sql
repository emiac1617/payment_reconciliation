-- Add 'store' column to orders and index for faster filtering
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store);

-- Optional: backfill store from existing 'Store' column if present via view/import
-- Note: If your current data uses a quoted identifier "Store", a manual copy may be needed:
-- UPDATE orders SET store = "Store" WHERE store IS NULL;