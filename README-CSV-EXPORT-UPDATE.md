# CSV Export Update

## Changes Made

1. Added new columns to the orders table:
   - `sku` (VARCHAR(255))
   - `hsn_code` (VARCHAR(255))
   - `igst` (DECIMAL(10,2))

2. Updated the Order interface in both:
   - `app/page.tsx`
   - `components/reconciliation-detail-dialog.tsx`

3. Modified the CSV export functionality in `handleDownloadCsv` function:
   - Added the new fields: `sku`, `hsn_code`, and `igst`
   - Removed `customer_email` and `customer_phone` fields as they are not in the database

4. Updated the order details dialog to display the new fields.

## How to Apply These Changes

1. Run the SQL script to add the new columns to the orders table:

```bash
psql -U your_username -d your_database -f scripts/add-sku-hsn-igst-columns.sql
```

Or execute the SQL commands directly in your database management tool.

2. Restart the application server (if needed).

3. The CSV export will now include the new columns when downloading order data.

## Notes

- The SQL script includes sample data for testing purposes. In a production environment, you should update the orders table with real data.
- The new fields are optional in the Order interface, so existing code will continue to work without modification.
- The CSV export will show "N/A" for any missing values in the new fields.