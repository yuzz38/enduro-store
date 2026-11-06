#!/usr/bin/env python3
"""
Сборка каталога Enduro Store.

  python3 tools/build.py [папка_с_исходными_фото]

Что делает:
  1. Берёт data/products.json.
  2. Для каждого фото (имя без расширения, .png/.jpg в папке исходников)
     делает img/p/<имя>-640.webp, -1280.webp и -1280.jpg (фолбэк).
  3. Пишет js/products.js (данные для модалки).
  4. Вставляет карточки в index.html и catalog.html между маркерами
     <!--CARDS:featured:start--> ... <!--CARDS:featured:end-->
     <!--CARDS:all:start--> ... <!--CARDS:all:end-->
     и JSON-LD каталога между <!--LD:catalog:start--> ... <!--LD:catalog:end-->.
  5. Обновляет sitemap.xml (дата lastmod).
"""
import json, os, re, sys, html, datetime
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "src")
DOMAIN = "https://enduro-store-pavlovsk.ru"   # заменить на реальный домен
OUT = os.path.join(ROOT, "img", "p")
os.makedirs(OUT, exist_ok=True)

products = json.load(open(os.path.join(ROOT, "data", "products.json"), encoding="utf-8"))
CATS = {"enduro": "Эндуро и кросс", "pit": "Питбайки", "atv": "Квадроциклы", "gear": "Экипировка"}


def find_src(stem):
    for f in os.listdir(SRC):
        if f.startswith(stem) and f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            return os.path.join(SRC, f)
    return None


sizes = {}
for p in products:
    for stem in p["images"]:
        big = os.path.join(OUT, f"{stem}-1280.jpg")
        if not os.path.exists(big):
            src = find_src(stem)
            if not src:
                sys.exit(f"Нет исходника для {stem}")
            im = Image.open(src).convert("RGB")
            for w in (640, 1280):
                r = im.copy()
                if r.width > w:
                    r = r.resize((w, round(r.height * w / r.width)), Image.LANCZOS)
                r.save(os.path.join(OUT, f"{stem}-{w}.webp"), "WEBP", quality=70, method=6)
                if w == 1280:
                    r.save(big, "JPEG", quality=74, optimize=True, progressive=True)
        with Image.open(big) as im:
            sizes[stem] = im.size


def rub(n):
    return f"{n:,}".replace(",", " ") + " ₽"


def picture(stem, alt, cls="", eager=False, sizes_attr="(max-width: 700px) 92vw, 30vw"):
    w, h = sizes[stem]
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<picture class="{cls}"><source type="image/webp" '
            f'srcset="img/p/{stem}-640.webp 640w, img/p/{stem}-1280.webp 1280w" sizes="{sizes_attr}">'
            f'<img src="img/p/{stem}-1280.jpg" width="{w}" height="{h}" alt="{html.escape(alt)}" {load} decoding="async"></picture>')


def card(p, page):
    href = f"#p={p['id']}" if page == "catalog" else f"catalog.html#p={p['id']}"
    t = html.escape(p["title"])
    old = ""
    if p.get("options"):
        old = f'<span class="plate__old plate__old--plain">или {rub(p["options"][-1][1])} собранный</span>'
    if p.get("oldPrice"):
        pct = round((1 - p["price"] / p["oldPrice"]) * 100)
        old = f'<s class="plate__old">{rub(p["oldPrice"])}</s><span class="plate__off">−{pct}%</span>'
    badge = f'<span class="card__badge">{html.escape(p["badge"])}</span>' if p.get("badge") else ""
    views = f'<span class="card__views">Посмотрели {p["views"]} человек</span>' if p.get("views") else ""
    return f'''<article class="card" data-id="{p['id']}" data-cat="{p['cat']}" data-price="{p['price'] or ''}">
  <a class="card__link" href="{href}" data-open="{p['id']}">
    <span class="card__media">{picture(p["images"][0], p["title"], "card__img")}{badge}</span>
    <span class="card__cat">{CATS[p['cat']]}</span>
    <h3 class="card__title">{t}</h3>
    <span class="card__short">{html.escape(p["short"])}</span>
  </a>
  <div class="card__foot">
    <div class="plate{'' if p['price'] else ' plate--ask'}"><b class="plate__price">{rub(p["price"]) if p["price"] else "Цена по запросу"}</b>{old}</div>
    {views}
    <button class="btn btn--small" type="button" data-buy="{p['id']}">Хочу купить</button>
  </div>
</article>'''


def inject(path, key, content):
    s = open(path, encoding="utf-8").read()
    pat = re.compile(rf"(<!--{key}:start-->)(.*?)(<!--{key}:end-->)", re.S)
    if not pat.search(s):
        sys.exit(f"Маркер {key} не найден в {path}")
    s = pat.sub(lambda m: m.group(1) + "\n" + content + "\n" + m.group(3), s)
    open(path, "w", encoding="utf-8").write(s)


featured = [p for p in products if p.get("featured")]
inject(os.path.join(ROOT, "index.html"), "CARDS:featured", "\n".join(card(p, "index") for p in featured))
inject(os.path.join(ROOT, "catalog.html"), "CARDS:all", "\n".join(card(p, "catalog") for p in products))

ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Каталог Enduro Store Павловск",
    "itemListElement": [{
        "@type": "ListItem", "position": i + 1,
        "item": {
            "@type": "Product",
            "name": p["title"],
            "description": p["lead"],
            "image": [f"{DOMAIN}/img/p/{s}-1280.jpg" for s in p["images"]],
            "url": f"{DOMAIN}/catalog.html#p={p['id']}",
            "category": CATS[p["cat"]],
            **({"offers": {
                "@type": "Offer", "price": p["price"], "priceCurrency": "RUB",
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition",
                "seller": {"@type": "Organization", "name": "Enduro Store Павловск"}
            }} if p["price"] else {})
        }
    } for i, p in enumerate(products)]
}
inject(os.path.join(ROOT, "catalog.html"), "LD:catalog",
       '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>")

js_data = [{k: v for k, v in p.items() if k != "featured"} for p in products]
for p in js_data:
    p["imgSize"] = {s: sizes[s] for s in p["images"]}
open(os.path.join(ROOT, "js", "products.js"), "w", encoding="utf-8").write(
    "/* Сгенерировано tools/build.py из data/products.json — правьте JSON, а не этот файл */\n"
    "window.PRODUCTS = " + json.dumps(js_data, ensure_ascii=False, indent=1) + ";\n")

today = datetime.date.today().isoformat()
open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>{DOMAIN}/</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority>
    <image:image><image:loc>{DOMAIN}/img/p/{products[0]["images"][0]}-1280.jpg</image:loc></image:image>
  </url>
  <url><loc>{DOMAIN}/catalog.html</loc><lastmod>{today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority>
''' + "".join(f'    <image:image><image:loc>{DOMAIN}/img/p/{p["images"][0]}-1280.jpg</image:loc><image:title>{html.escape(p["title"])}</image:title></image:image>\n' for p in products) +
'''  </url>
</urlset>
''')
print(f"OK: {len(products)} товаров, {len(sizes)} фото")
