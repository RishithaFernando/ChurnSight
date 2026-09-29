-- ChurnSight Database Setup
-- Run this file in pgAdmin Query Tool after creating the churnsight database

-- Step 1: Create the database (run this separately first)
-- CREATE DATABASE churnsight;

-- Step 2: Connect to churnsight database and run the rest

-- Table 1: admins
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    survey_token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table 3: customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gender INTEGER,
    age INTEGER,
    senior_citizen INTEGER,
    married INTEGER,
    dependents INTEGER,
    number_of_dependents INTEGER,
    referred_a_friend INTEGER,
    number_of_referrals INTEGER,
    tenure_in_months INTEGER,
    offer VARCHAR(50),
    phone_service INTEGER,
    avg_monthly_long_distance_charges FLOAT,
    multiple_lines INTEGER,
    internet_service INTEGER,
    internet_type VARCHAR(50),
    avg_monthly_gb_download INTEGER,
    online_security INTEGER,
    online_backup INTEGER,
    device_protection_plan INTEGER,
    premium_tech_support INTEGER,
    streaming_tv INTEGER,
    streaming_movies INTEGER,
    streaming_music INTEGER,
    unlimited_data INTEGER,
    contract INTEGER,
    paperless_billing INTEGER,
    payment_method VARCHAR(50),
    monthly_charge FLOAT,
    total_charges FLOAT,
    total_refunds FLOAT,
    total_extra_data_charges INTEGER,
    total_long_distance_charges FLOAT,
    satisfaction_score INTEGER,
    campaign_id INTEGER REFERENCES campaigns(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: predictions
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    prediction INTEGER,
    probability FLOAT,
    risk_level VARCHAR(20),
    recommendation TEXT,
    shap_values JSONB,
    top_factors JSONB,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_token 
    ON campaigns(survey_token);
CREATE INDEX IF NOT EXISTS idx_customers_campaign 
    ON customers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_predictions_customer 
    ON predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_predictions_risk 
    ON predictions(risk_level);

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;