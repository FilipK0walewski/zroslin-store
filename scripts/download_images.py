import os
import psycopg2
import requests

from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from PIL import Image
from psycopg2.extras import execute_values


def download(image_id, url):

    a, b = url.replace('https://dropshipping.hagne.pl/', '').split('/')
    a = a.replace('-thickbox_default', '')
    c, d = b.split('.')
    a = a.strip('-')
    c = c.strip('-')
    image_path = f'{c}-{a}.{d}'

    response = requests.get(url)
    if response.status_code != 200:
        return image_id, None

    img = Image.open(BytesIO(response.content))

    scale_factor = .4
    new_width = int(img.width * scale_factor)
    new_height = int(img.height * scale_factor)

    scaled_img = img.resize((new_width, new_height), resample=Image.Resampling.LANCZOS)
    scaled_img.save(f'../public/images/small/{image_path}', format='JPEG', quality=85)

    img.save(f'../public/images/big/{image_path}', format='JPEG', quality=85)

    return image_id, image_path

def main():
    conn = psycopg2.connect(host='localhost', dbname='zroslin', user='zroslin', password='zroslin')
    cur = conn.cursor()

    cur.execute('select id, url from images where name is null')
    data = [i for i in cur]

    pool = ThreadPoolExecutor(30)
    future_threads = []

    d, dd = 0, 0
    for image_id, url in data:
        future = pool.submit(download, image_id, url)
        future_threads.append(future)
        dd += 1

    update_data = []
    for i in future_threads:
        iid, p = i.result()
        update_data.append([iid, p])
        if d % 100 == 0:
            print(f'{d} / {dd}')
        d += 1

    q = '''
        UPDATE images a set name = b.name from (values %s) as b(id, name) where a.id = b.id
    '''

    execute_values(cur, q, update_data)

    conn.commit()
    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
