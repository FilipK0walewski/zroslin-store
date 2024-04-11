CREATE TABLE IF NOT EXISTS categories(
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id INT,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE OR REPLACE FUNCTION update_slug_categories()
RETURNS TRIGGER AS $$
DECLARE
    nice_name VARCHAR;
BEGIN
    nice_name := LOWER(NEW.name);
    nice_name := REPLACE(nice_name, 'ą', 'a');
    nice_name := REPLACE(nice_name, 'ć', 'c');
    nice_name := REPLACE(nice_name, 'ę', 'e');
    nice_name := REPLACE(nice_name, 'ł', 'l');
    nice_name := REPLACE(nice_name, 'ń', 'n');
    nice_name := REPLACE(nice_name, 'ó', 'o');
    nice_name := REPLACE(nice_name, 'ś', 's');
    nice_name := REPLACE(nice_name, 'ź', 'z');
    nice_name := REPLACE(nice_name, 'ż', 'z');
    NEW.slug = REGEXP_REPLACE(nice_name, '[^a-zA-Z0-9]+', '-', 'g');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slug_categories_trigger
BEFORE INSERT OR UPDATE
ON categories
FOR EACH ROW
EXECUTE FUNCTION update_slug_categories();

CREATE TABLE IF NOT EXISTS products(
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    manufacturer VARCHAR(50) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    ean VARCHAR(13) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    price REAL NOT NULL,
    tax_rate INT NOT NULL,
    color VARCHAR(20),
    category_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE OR REPLACE FUNCTION update_slug_products()
RETURNS TRIGGER AS $$
DECLARE
    nice_name VARCHAR;
BEGIN
    nice_name := LOWER(NEW.name);
    nice_name := REPLACE(nice_name, 'ą', 'a');
    nice_name := REPLACE(nice_name, 'ć', 'c');
    nice_name := REPLACE(nice_name, 'ę', 'e');
    nice_name := REPLACE(nice_name, 'ł', 'l');
    nice_name := REPLACE(nice_name, 'ń', 'n');
    nice_name := REPLACE(nice_name, 'ó', 'o');
    nice_name := REPLACE(nice_name, 'ś', 's');
    nice_name := REPLACE(nice_name, 'ź', 'z');
    nice_name := REPLACE(nice_name, 'ż', 'z');
    NEW.slug = CONCAT(REGEXP_REPLACE(nice_name, '[^a-zA-Z0-9]+', '-', 'g'), '-', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slug_products_trigger
BEFORE INSERT OR UPDATE
ON products
FOR EACH ROW
EXECUTE FUNCTION update_slug_products();

CREATE TABLE IF NOT EXISTS images(
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    url TEXT UNIQUE NOT NULL,
    name TEXT UNIQUE,
    product_id INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(60) UNIQUE NOT NULL,
    email VARCHAR(60) UNIQUE NOT NULL,
    password VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION GetCategoryHierarchy(category_slug VARCHAR(255)) 
RETURNS TABLE (id INT, name VARCHAR(50), slug VARCHAR(255), parent_id INT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE CategoryHierarchy AS (
        SELECT c.id, c.name, c.slug, c.parent_id
        FROM categories c
        WHERE c.slug = category_slug

        UNION ALL

        SELECT c.id, c.name, c.slug, c.parent_id
        FROM categories c
        INNER JOIN CategoryHierarchy ch ON c.parent_id = ch.id
    )
    SELECT * FROM CategoryHierarchy;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS addresses (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) NOT NULL,
    phone VARCHAR(12) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(50) NOT NULL,
    zipcode VARCHAR(6) NOT NULL,
    street VARCHAR(50) NOT NULL,
    building VARCHAR(10) NOT NULL,
    flat VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    url_id TEXT UNIQUE NOT NULL,
    shipping_method TEXT NOT NULL,
    user_id INT,
    session_id TEXT NOT NULL,
    address_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    amount INT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    stripe_payment_id TEXT UNIQUE NOT NULL,
    client_secret TEXT UNIQUE NOT NULL,
    order_id INT UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    redirect_status VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);