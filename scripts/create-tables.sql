-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_partner VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for Razorpay (corrected name and columns as per schema)
CREATE TABLE IF NOT EXISTS razorpay (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    order_number VARCHAR(255),
    method VARCHAR(50),
    table_name TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for GoKwik (corrected name and columns as per schema)
CREATE TABLE IF NOT EXISTS gokwik (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Order Number" VARCHAR(255),
    "Payment Id" VARCHAR(100) UNIQUE NOT NULL,
    "Amount" NUMERIC(10,2) NOT NULL,
    "Currency" VARCHAR(10) DEFAULT 'INR',
    "Payment Method" TEXT,
    "Credited Amount" NUMERIC(10,2),
    "Transaction Date" TIMESTAMP WITH TIME ZONE,
    "Shopify Order Id" BIGINT,
    order_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for Snapmint
CREATE TABLE IF NOT EXISTS snapmint (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Payment ID" VARCHAR(100) UNIQUE NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    "Order Number" VARCHAR(255),
    "Settlement Amount" NUMERIC(10,2) NOT NULL,
    "Order Value" NUMERIC(10,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping table for Shiprocket (corrected name and columns as per schema)
CREATE TABLE IF NOT EXISTS shiprocket (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    awb_number VARCHAR(100),
    delivered_date DATE,
    order_number VARCHAR(255),
    courier VARCHAR(100),
    amount NUMERIC(10,2),
    status VARCHAR(50) NOT NULL,
    tracking_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping table for Nimbus (corrected name and columns as per schema)
CREATE TABLE IF NOT EXISTS nimbus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    awb VARCHAR(100),
    order_number VARCHAR(255),
    amount NUMERIC(10,2),
    status VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    payment_type VARCHAR(50),
    pincode VARCHAR(20),
    dest_city VARCHAR(255),
    dest_state VARCHAR(255),
    carrier VARCHAR(100),
    delivery_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping table for BlueDart (corrected name and columns as per schema)
CREATE TABLE IF NOT EXISTS bluedart (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    order_number VARCHAR(255),
    amount NUMERIC(10,2),
    pick_up_date DATE,
    process_date DATE,
    awb VARCHAR(100) UNIQUE NOT NULL,
    pincode VARCHAR(20),
    dest_area VARCHAR(255),
    dest_location VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    tracking_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping table for Delhivery (corrected name and columns as per schema)
CREATE TABLE IF NOT EXISTS delhivery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    waybill_num VARCHAR(100) UNIQUE NOT NULL,
    remittance_number VARCHAR(100),
    pickup_date DATE,
    destination_city VARCHAR(255),
    destination_pin VARCHAR(20),
    package_type VARCHAR(50),
    product_value NUMERIC(10,2),
    cod_amount NUMERIC(10,2),
    status VARCHAR(50) NOT NULL,
    status_date DATE,
    payable NUMERIC(10,2),
    is_mps BOOLEAN,
    product_description TEXT,
    tracking_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reconciliation table
CREATE TABLE IF NOT EXISTS reconciliation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    total_payments DECIMAL(10,2) DEFAULT 0,
    total_shipping_charges DECIMAL(10,2) DEFAULT 0,
    total_cod_amount DECIMAL(10,2) DEFAULT 0,
    difference DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- matched, discrepancy, missing_payment
    adjusted_amount DECIMAL(10,2) DEFAULT 0,
    remark TEXT,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (updated table names)
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_razorpay_order_id ON razorpay(order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payment_id ON razorpay(payment_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_created_at ON razorpay("createdAt");

CREATE INDEX IF NOT EXISTS idx_gokwik_order_id ON gokwik(order_id);
CREATE INDEX IF NOT EXISTS idx_gokwik_payment_id ON gokwik("Payment Id");
CREATE INDEX IF NOT EXISTS idx_gokwik_created_at ON gokwik(created_at);

CREATE INDEX IF NOT EXISTS idx_snapmint_order_id ON snapmint(order_id);
CREATE INDEX IF NOT EXISTS idx_snapmint_payment_id ON snapmint("Payment ID");
CREATE INDEX IF NOT EXISTS idx_snapmint_created_at ON snapmint(created_at);

CREATE INDEX IF NOT EXISTS idx_shiprocket_order_id ON shiprocket(order_id);
CREATE INDEX IF NOT EXISTS idx_nimbus_order_id ON nimbus(order_id);
CREATE INDEX IF NOT EXISTS idx_bluedart_order_id ON bluedart(order_id);
CREATE INDEX IF NOT EXISTS idx_delhivery_order_id ON delhivery(order_id);

-- Create payments table for Shipway
CREATE TABLE IF NOT EXISTS shipway (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_number VARCHAR(255),
    "Order Value" NUMERIC(10,2),
    order_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipway_order_id ON shipway(order_id);
CREATE INDEX IF NOT EXISTS idx_shipway_created_at ON shipway(created_at);

CREATE INDEX IF NOT EXISTS idx_reconciliation_order_id ON reconciliation(order_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_status ON reconciliation(status);
