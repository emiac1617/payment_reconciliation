-- Insert sample orders
INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, amount, status, payment_status) VALUES
('ORD001', 'John Doe', 'john.doe@email.com', '+91-9876543210', 1299.99, 'completed', 'paid'),
('ORD002', 'Jane Smith', 'jane.smith@email.com', '+91-9876543211', 899.50, 'completed', 'pending'),
('ORD003', 'Mike Johnson', 'mike.johnson@email.com', '+91-9876543212', 2199.00, 'completed', 'paid'),
('ORD004', 'Sarah Wilson', 'sarah.wilson@email.com', '+91-9876543213', 1599.75, 'processing', 'paid'),
('ORD005', 'David Brown', 'david.brown@email.com', '+91-9876543214', 799.25, 'completed', 'pending');

-- Insert sample Razorpay payments (corrected table and column names)
INSERT INTO razorpay (order_id, payment_id, amount, method, "createdAt") VALUES
('ORD001', 'pay_razorpay_001', 1299.99, 'card', '2024-01-19T10:00:00Z'),
('ORD003', 'pay_razorpay_002', 2100.00, 'upi', '2024-01-21T11:30:00Z'),
('ORD004', 'pay_razorpay_003', 1599.75, 'netbanking', '2024-01-20T14:15:00Z');

-- Insert sample GoKwik payments (corrected table and column names)
INSERT INTO gokwik (order_id, "Payment Id", "Amount", "Payment Method", "Transaction Date") VALUES
('ORD002', 'gokwik_txn_001', 899.50, 'COD', '2024-01-19T10:05:00Z'),
('ORD005', 'gokwik_txn_002', 799.25, 'Prepaid', '2024-01-22T09:45:00Z');

-- Insert sample Snapmint payments
INSERT INTO snapmint (order_id, "Payment ID", "Order Number", "Settlement Amount", "Order Value") VALUES
('ORD001', 'snap_pay_001', 'ORD001', 1250.00, 1299.99),
('ORD003', 'snap_pay_002', 'ORD003', 2050.00, 2199.00),
('ORD004', 'snap_pay_003', 'ORD004', 1550.00, 1599.75);

-- Insert sample Shiprocket data (corrected table and column names)
INSERT INTO shiprocket (order_id, awb_number, delivered_date, courier, amount, status) VALUES
('ORD001', 'AWB001', '2024-01-20', 'BlueDart', 50.00, 'delivered'),
('ORD002', 'AWB002', '2024-01-25', 'Delhivery', 45.00, 'in_transit'),
('ORD003', 'AWB003', '2024-01-22', 'Ekart', 60.00, 'delivered');

-- Insert sample Nimbus data (corrected table and column names)
INSERT INTO nimbus (order_id, awb, amount, status, type, payment_type, pincode, dest_city, dest_state, carrier) VALUES
('ORD004', 'TRK001', 55.00, 'delivered', 'Forward', 'Prepaid', '110001', 'New Delhi', 'Delhi', 'Nimbus Express'),
('ORD005', 'TRK002', 40.00, 'out_for_delivery', 'Forward', 'COD', '400001', 'Mumbai', 'Maharashtra', 'Nimbus Express');

-- Insert sample BlueDart data (corrected table and column names)
INSERT INTO bluedart (order_id, order_number, amount, pick_up_date, process_date, awb, pincode, dest_area, dest_location, status) VALUES
('ORD001', 'ORD001', 75.00, '2024-01-19', '2024-01-19', 'BD001', '110001', 'Connaught Place', 'Delhi', 'delivered'),
('ORD003', 'ORD003', 65.00, '2024-01-21', '2024-01-21', 'BD002', '560001', 'Koramangala', 'Bengaluru', 'delivered');

-- Insert sample Delhivery data (corrected table and column names)
INSERT INTO delhivery (order_id, waybill_num, remittance_number, pickup_date, destination_city, destination_pin, package_type, product_value, cod_amount, status, status_date, payable, is_mps, product_description) VALUES
('ORD002', 'DEL001', 'REM001', '2024-01-20', 'Mumbai', '400001', 'Standard', 899.50, 899.50, 'in_transit', '2024-01-20', 899.50, FALSE, 'Electronics'),
('ORD004', 'DEL002', 'REM002', '2024-01-20', 'Bangalore', '560001', 'Express', 1599.75, 0.00, 'delivered', '2024-01-21', 1599.75, FALSE, 'Apparel');
