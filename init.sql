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
    stock INT NOT NULL DEFAULT 0,
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
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);