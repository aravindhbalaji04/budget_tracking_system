-- Budget Tracker Pro Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- User profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    username TEXT NOT NULL,
    income DECIMAL(10,2) NOT NULL,
    savings_goal DECIMAL(5,2) DEFAULT 20,
    portfolio_goal DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expenses table
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
    year INTEGER NOT NULL,
    date TEXT NOT NULL,
    food DECIMAL(10,2) DEFAULT 0,
    travel DECIMAL(10,2) DEFAULT 0,
    entertainment DECIMAL(10,2) DEFAULT 0,
    miscellaneous DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    total DECIMAL(10,2) NOT NULL,
    is_investment BOOLEAN DEFAULT FALSE,
    investment_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Investments table
CREATE TABLE investments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    type TEXT NOT NULL,
    type_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Portfolio summary table
CREATE TABLE portfolio_summary (
    user_id UUID REFERENCES auth.users PRIMARY KEY,
    total_invested DECIMAL(10,2) DEFAULT 0,
    current_value DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Policies

-- User profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Expenses RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Investments RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON investments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON investments
    FOR DELETE USING (auth.uid() = user_id);

-- Portfolio summary RLS
ALTER TABLE portfolio_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio summary" ON portfolio_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio summary" ON portfolio_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio summary" ON portfolio_summary
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_expenses_user_month_year ON expenses(user_id, year, month);
CREATE INDEX idx_investments_user_date ON investments(user_id, date);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_investments_type ON investments(type);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update portfolio summary
CREATE OR REPLACE FUNCTION update_portfolio_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO portfolio_summary (user_id, total_invested, current_value, last_updated)
    SELECT 
        user_id,
        COALESCE(SUM(amount), 0) as total_invested,
        COALESCE(SUM(current_value), 0) as current_value,
        timezone('utc'::text, now()) as last_updated
    FROM investments 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    GROUP BY user_id
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_invested = EXCLUDED.total_invested,
        current_value = EXCLUDED.current_value,
        last_updated = EXCLUDED.last_updated;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers for automatic portfolio summary updates
CREATE TRIGGER trigger_update_portfolio_summary_insert
    AFTER INSERT ON investments
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_summary();

CREATE TRIGGER trigger_update_portfolio_summary_update
    AFTER UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_summary();

CREATE TRIGGER trigger_update_portfolio_summary_delete
    AFTER DELETE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_summary();
