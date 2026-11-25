"""Gera a versão estática do site para publicar no Cloudflare.

Uso:
    python build_static.py

Resultado:
    nexusdesign-site/        -> pasta para arrastar no Cloudflare (New deployment)
    nexusdesign-site.zip     -> a mesma pasta em ZIP (útil para descarregar do GitHub)
"""
import os
import shutil
import zipfile

from app import app, render_home

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'nexusdesign-site')
ZIP = OUT + '.zip'


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    with app.test_request_context('/'):
        html = render_home(static_build=True)
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)

    shutil.copytree(os.path.join(ROOT, 'static'), os.path.join(OUT, 'static'))

    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, _, files in os.walk(OUT):
            for name in files:
                full = os.path.join(folder, name)
                z.write(full, os.path.relpath(full, ROOT))

    print('Site estático gerado em', OUT)
    print('ZIP:', ZIP)


if __name__ == '__main__':
    main()
