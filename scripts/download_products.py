import psycopg2
import requests

from bs4 import BeautifulSoup


def main():
    conn = psycopg2.connect(host='localhost', dbname='zroslin', user='zroslin', password='zroslin')
    cur = conn.cursor()

    print('update products start')
    r = requests.get('https://dropshipping.hagne.pl/module/xmlfeeds/api?id=12')
    print(f'response status code: {r.status_code}')
    if r.status_code != 200:
        return

    soup = BeautifulSoup(r.text, 'xml')
    all_categories, products, images = {}, {}, {}
    for product in soup.find('products').find_all('product'):
        product_id = product.find('id').text
        if product_id in products:
            continue

        manufacturer = product.find('manufacturer').text
        ean = product.find('ean13').text
        quantity = product.find('quantity').text
        description = product.find('description').text
        name = product.find('name').text
        category = product.find('category').text
        price = product.find('price').text.replace(',', '.')
        tax_rate = product.find('tax_rate').text
        color = product.find('Kolor').text if product.find('Kolor') is not None else None

        categories = [i.strip() for i in product.find('product_category_tree').text.split('>')]
        for i in range(len(categories)):
            parent, category = None, categories[i]
            if i != 0:
                parent = categories[i - 1]
            if i not in all_categories:
                all_categories[i] = set()
            all_categories[i].add((category, parent))

        product_images, found_images = [], product.find('images')
        if found_images is not None:
            for i in found_images.find_all('thickbox'):
                product_images.append(i.text.strip())
            images[product_id] = product_images

        product = {
            'manufacturer': manufacturer, 
            'product_id': product_id, 
            'ean': ean, 
            'quantity': quantity, 
            'description': description, 
            'name': name, 
            'price': price, 
            'tax_rate': tax_rate, 
            'color': color, 
            'category': categories[-1]
        }
        products[product_id] = product

    print('updating categories')
    db_category_map = {}
    for i in all_categories.keys():
        for category_name, parent in all_categories[i]:
            parent_id = None
            if parent is not None:
                parent_id = db_category_map[parent]
            
            cur.execute('select id from categories where name = %s', (category_name,))
            category_id = cur.fetchone()
            if not category_id:
                cur.execute('insert into categories(name, parent_id) values (%s, %s) returning id', (category_name, parent_id))
                category_id = cur.fetchone()
            
            category_id = category_id[0]
            db_category_map[category_name] = category_id

    print('updating products')

    upsert_query = '''
        insert into products(manufacturer, sku, ean, quantity, description, name, price, tax_rate, color, category_id)
        values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        on conflict (sku) do update set 
        manufacturer = excluded.manufacturer,
        ean = excluded.ean,
        quantity = excluded.quantity,
        description = excluded.description,
        name = excluded.name,
        price = excluded.price,
        color = excluded.color,
        category_id = excluded.category_id
        returning id
    '''

    db_product_map = {}          
    for product_id, product_data in products.items():
        tmp = product_data['category']
        product_data['category'] = db_category_map[tmp]
        product_data_tuple = tuple(product_data.values())
        cur.execute(upsert_query, product_data_tuple)
        genereted_product_id = cur.fetchone()[0]
        db_product_map[product_id] = genereted_product_id

    print('updating images')
    for product_id, product_images in images.items():
        for image in product_images:
            db_product_id = db_product_map[product_id]
            cur.execute('insert into images(url, product_id) values (%s, %s) on conflict (url) do nothing', (image, db_product_id))
    
    conn.commit()
    print('end')


if __name__ == '__main__':
    main()
