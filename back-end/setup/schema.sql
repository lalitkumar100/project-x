-- ── Sequences ────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS brands_id_seq             START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS categories_id_seq         START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS contact_addresses_id_seq  START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS contact_phones_id_seq     START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS contacts_id_seq           START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS customer_addresses_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS customer_phones_id_seq    START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS customers_id_seq          START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS employees_id_seq          START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS items_id_seq              START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS item_datasets_id_seq      START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS purchase_items_id_seq     START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS purchases_id_seq          START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS replacement_items_id_seq  START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS sales_id_seq              START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS sales_items_id_seq        START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS subcategories_id_seq      START 1 INCREMENT 1;

-- ── Tables ───────────────────────────────────────────────────────

CREATE TABLE brands (
  id         INTEGER      NOT NULL DEFAULT nextval('brands_id_seq'),
  name       VARCHAR(255) NOT NULL,
  rating     NUMERIC(2,1),
  created_at TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT brands_pkey     PRIMARY KEY (id),
  CONSTRAINT brands_name_key UNIQUE (name)
);

CREATE TABLE categories (
  id         INTEGER      NOT NULL DEFAULT nextval('categories_id_seq'),
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_pkey     PRIMARY KEY (id),
  CONSTRAINT categories_name_key UNIQUE (name)
);

CREATE TABLE subcategories (
  id          INTEGER      NOT NULL DEFAULT nextval('subcategories_id_seq'),
  name        VARCHAR(255) NOT NULL,
  category_id INTEGER      NOT NULL,
  created_at  TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subcategories_pkey             PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE contacts (
  id           INTEGER      NOT NULL DEFAULT nextval('contacts_id_seq'),
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255),
  contact_type VARCHAR(50),
  created_at   TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  gst_no       VARCHAR(50),
  tcg_id       VARCHAR(50),
  CONSTRAINT contacts_pkey          PRIMARY KEY (id),
  CONSTRAINT unique_contacts_tcg_id UNIQUE (tcg_id)
);

CREATE TABLE contact_addresses (
  id           INTEGER NOT NULL DEFAULT nextval('contact_addresses_id_seq'),
  contact_id   INTEGER,
  address_line TEXT,
  city         VARCHAR(100),
  state        VARCHAR(100),
  pincode      VARCHAR(20),
  label        VARCHAR(50),
  CONSTRAINT contact_addresses_pkey           PRIMARY KEY (id),
  CONSTRAINT contact_addresses_contact_id_fkey FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE contact_phones (
  id         INTEGER NOT NULL DEFAULT nextval('contact_phones_id_seq'),
  contact_id INTEGER,
  phone      VARCHAR(20),
  label      VARCHAR(50),
  CONSTRAINT contact_phones_pkey            PRIMARY KEY (id),
  CONSTRAINT contact_phones_contact_id_fkey FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE customers (
  id         INTEGER      NOT NULL DEFAULT nextval('customers_id_seq'),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  created_at TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  tcg_id     VARCHAR(50),
  CONSTRAINT customers_pkey          PRIMARY KEY (id),
  CONSTRAINT unique_customers_tcg_id UNIQUE (tcg_id)
);

CREATE TABLE customer_addresses (
  id           INTEGER NOT NULL DEFAULT nextval('customer_addresses_id_seq'),
  customer_id  INTEGER,
  address_line TEXT,
  city         VARCHAR(100),
  state        VARCHAR(100),
  pincode      VARCHAR(20),
  label        VARCHAR(50),
  CONSTRAINT customer_addresses_pkey             PRIMARY KEY (id),
  CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE customer_phones (
  id          INTEGER NOT NULL DEFAULT nextval('customer_phones_id_seq'),
  customer_id INTEGER,
  phone       VARCHAR(20),
  label       VARCHAR(50),
  CONSTRAINT customer_phones_pkey             PRIMARY KEY (id),
  CONSTRAINT customer_phones_customer_id_fkey FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE employees (
  id           INTEGER      NOT NULL DEFAULT nextval('employees_id_seq'),
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(20),
  role         VARCHAR(50),
  salary       NUMERIC(10,2),
  joining_date DATE,
  status       VARCHAR(50),
  created_at   TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

CREATE TABLE items (
  id               INTEGER      NOT NULL DEFAULT nextval('items_id_seq'),
  name             VARCHAR(255) NOT NULL,
  brand_id         INTEGER,
  category_id      INTEGER,
  subcategory_id   INTEGER,
  quantity         INTEGER              DEFAULT 0,
  reorder_level    INTEGER,
  mrp              NUMERIC(10,2),
  net_buy_price    NUMERIC(10,2),
  description      TEXT,
  created_at       TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  total_items_sold INTEGER              DEFAULT 0,
  warranty_months  INTEGER,
  CONSTRAINT items_pkey             PRIMARY KEY (id),
  CONSTRAINT items_brand_id_fkey    FOREIGN KEY (brand_id)       REFERENCES brands(id)       ON DELETE SET NULL,
  CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id)    REFERENCES categories(id)   ON DELETE SET NULL,
  CONSTRAINT items_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

CREATE TABLE item_datasets (
  id           INTEGER NOT NULL DEFAULT nextval('item_datasets_id_seq'),
  item_id      INTEGER NOT NULL,
  dataset_name VARCHAR(255) NOT NULL,
  dataset_path TEXT NOT NULL,
  uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT item_datasets_pkey PRIMARY KEY (id),
  CONSTRAINT item_datasets_item_id_key UNIQUE (item_id),
  CONSTRAINT item_datasets_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE purchases (
  id             INTEGER      NOT NULL DEFAULT nextval('purchases_id_seq'),
  wholesaler_id  INTEGER,
  transporter_id INTEGER,
  invoice_number VARCHAR(100),
  payment_method VARCHAR(50),
  total_amount   NUMERIC(12,2),
  total_box      INTEGER,
  extra_cost     NUMERIC(10,2),
  billing_date   DATE,
  delivered_date DATE,
  payment_status VARCHAR(50),
  billing_type   VARCHAR(50),
  created_at     TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT purchases_pkey                PRIMARY KEY (id),
  CONSTRAINT purchases_wholesaler_id_fkey  FOREIGN KEY (wholesaler_id)  REFERENCES contacts(id),
  CONSTRAINT purchases_transporter_id_fkey FOREIGN KEY (transporter_id) REFERENCES contacts(id)
);

CREATE TABLE purchase_items (
  id          INTEGER      NOT NULL DEFAULT nextval('purchase_items_id_seq'),
  purchase_id INTEGER,
  item_id     INTEGER,
  quantity    INTEGER,
  buy_price   NUMERIC(10,2),
  total_price NUMERIC(12,2),
  tax_percent NUMERIC(5,2),
  CONSTRAINT purchase_items_pkey             PRIMARY KEY (id),
  CONSTRAINT purchase_items_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  CONSTRAINT purchase_items_item_id_fkey     FOREIGN KEY (item_id)     REFERENCES items(id)
);

CREATE TABLE sales (
  id             INTEGER      NOT NULL DEFAULT nextval('sales_id_seq'),
  invoice_number VARCHAR(100),
  customer_id    INTEGER,
  employee_id    INTEGER,
  transporter_id INTEGER,
  customer_type  VARCHAR(50),
  billing_type   VARCHAR(50),
  total_amount   NUMERIC(12,2),
  extra_cost     NUMERIC(10,2),
  transport_cost NUMERIC(10,2),
  final_amount   NUMERIC(12,2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  billing_date   DATE,
  delivered_date DATE,
  total_box      INTEGER,
  status         VARCHAR(50),
  created_at     TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  blockchain_status VARCHAR(10),
  blockchain_txn_id VARCHAR(10),
  CONSTRAINT sales_pkey              PRIMARY KEY (id),
  CONSTRAINT sales_customer_id_fkey  FOREIGN KEY (customer_id)    REFERENCES customers(id),
  CONSTRAINT sales_employee_id_fkey  FOREIGN KEY (employee_id)    REFERENCES employees(id),
  CONSTRAINT sales_transporter_id_fkey FOREIGN KEY (transporter_id) REFERENCES contacts(id)
);

CREATE TABLE sales_items (
  id         INTEGER      NOT NULL DEFAULT nextval('sales_items_id_seq'),
  sale_id    INTEGER,
  item_id    INTEGER,
  serial_no  VARCHAR(100),
  quantity   INTEGER,
  sell_price NUMERIC(10,2),
  total_price NUMERIC(12,2),
  discount   NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  created_at TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sales_items_pkey        PRIMARY KEY (id),
  CONSTRAINT sales_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT sales_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE replacement_items (
  id               INTEGER NOT NULL DEFAULT nextval('replacement_items_id_seq'),
  customer_id      INTEGER,
  sale_id          INTEGER,
  item_id          INTEGER,
  replacement_date DATE,
  reason           VARCHAR(50),
  reason_details   TEXT,
  quantity         INTEGER,
  status           VARCHAR(50),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT replacement_items_pkey            PRIMARY KEY (id),
  CONSTRAINT replacement_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT replacement_items_sale_id_fkey     FOREIGN KEY (sale_id)     REFERENCES sales(id),
  CONSTRAINT replacement_items_item_id_fkey     FOREIGN KEY (item_id)     REFERENCES items(id)
);

-- ── Views ────────────────────────────────────────────────────────

CREATE VIEW item_all AS
  SELECT i.id,
         i.name             AS item_name,
         b.name             AS brand_name,
         i.quantity,
         i.warranty_months,
         i.mrp              AS price,
         s.name             AS subcategory_name,
         i.total_items_sold
    FROM items i
    LEFT JOIN brands        b ON i.brand_id       = b.id
    LEFT JOIN subcategories s ON i.subcategory_id = s.id;

CREATE VIEW item_full_details AS
  SELECT i.id,
         i.name             AS item_name,
         b.name             AS brand_name,
         i.quantity,
         i.warranty_months,
         i.mrp              AS price,
         s.name             AS subcategory_name,
         i.total_items_sold
    FROM items i
    LEFT JOIN brands        b ON i.brand_id       = b.id
    LEFT JOIN subcategories s ON i.subcategory_id = s.id;

CREATE VIEW items_overview AS
  SELECT i.id,
         i.name,
         i.quantity,
         b.name             AS brand,
         s.name             AS subcategory,
         i.total_items_sold,
         i.warranty_months,
         i.mrp,
         i.reorder_level,
         i.description,
         i.net_buy_price
    FROM items i
    LEFT JOIN brands        b ON i.brand_id       = b.id
    LEFT JOIN subcategories s ON i.subcategory_id = s.id;

CREATE VIEW wholesaler_all AS
  SELECT id,
         name,
         gst_no,
         (SELECT cp.phone FROM contact_phones cp    WHERE cp.contact_id = c.id LIMIT 1) AS phone,
         (SELECT ca.city  FROM contact_addresses ca  WHERE ca.contact_id = c.id LIMIT 1) AS city
    FROM contacts c
   WHERE contact_type = 'wholesaler';

CREATE VIEW wholesaler_details_view AS
  SELECT c.id,
         c.name,
         c.email,
         c.contact_type,
         c.gst_no,
         c.created_at,
         COALESCE(
           json_agg(DISTINCT jsonb_build_object('id', p.id, 'phone', p.phone, 'label', p.label))
           FILTER (WHERE p.id IS NOT NULL), '[]'::json
         ) AS phones,
         COALESCE(
           json_agg(DISTINCT jsonb_build_object(
             'id', a.id, 'address_line', a.address_line, 'city', a.city,
             'state', a.state, 'pincode', a.pincode, 'label', a.label
           )) FILTER (WHERE a.id IS NOT NULL), '[]'::json
         ) AS addresses
    FROM contacts c
    LEFT JOIN contact_phones    p ON p.contact_id = c.id
    LEFT JOIN contact_addresses a ON a.contact_id = c.id
   WHERE c.contact_type = 'wholesaler'
   GROUP BY c.id;


-- 1. Insert default Unregistered customer with ID = 1
INSERT INTO customers (id, name) 
VALUES (1, 'Unregistered') 
ON CONFLICT (id) DO NOTHING;

-- 2. Synchronize the customer ID sequence so subsequent inserts start from 2
SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1), true);
