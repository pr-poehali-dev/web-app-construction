CREATE TABLE IF NOT EXISTS purchase_amounts (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(500) DEFAULT '',
    sort_order INTEGER DEFAULT 0
);