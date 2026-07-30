# -*- coding: utf-8 -*-
# Converte as mensagens do Telegram (messages.jsonl) para o schema do Radar de Ofertas,
# recategorizado para tech/promo. Gera dados/<canal>.json no repo.
import os, re, json, glob

SRC = os.path.expanduser('~/Downloads/02-Pessoal/AI-Outputs')
DADOS = os.path.expanduser('~/Documents/radar-ofertas/dados')
os.makedirs(DADOS, exist_ok=True)

CHANNELS = [
 ('telegram-pcdofafa',        'PC do Fafá',              'pcdofafapromo'),
 ('telegram-peperaiohardware','Peperaio Hardware',       'peperaiohardware'),
 ('telegram-achadinhos3d',    'Achadinhos 3D',           'achadinhos3D'),
 ('telegram-linguicapromocoes','Linguiça das Promoções', 'linguicapromocoes'),
]

CATS = [
 ('Impressão 3D', ['impressora 3d','impressão 3d','impressao 3d','bambu lab','bambulab',' filamento','petg',' pla ',' resina',' ender','creality','flashforge',' nozzle','extrusora','a1 mini','x1 carbon',' p1s',' p1p',' ams ']),
 ('Memória RAM', ['memória ram','memoria ram',' ram ',' ddr4',' ddr5',' dimm','sodimm','so-dimm','pc4-','ecc reg']),
 ('Processador', ['processador',' ryzen','core i3','core i5','core i7','core i9','intel core',' xeon',' cpu ',' am4 ',' am5 ','threadripper']),
 ('Placa de vídeo', ['placa de vídeo','placa de video',' rtx',' gtx ',' rx 5',' rx 6',' rx 7',' rx 9','radeon','geforce',' gpu ','intel arc']),
 ('Placa-mãe', ['placa-mãe','placa mãe','placa mae','motherboard',' b450',' b550',' b650',' a520',' h510',' h610',' b760',' z690',' z790',' x99','chipset']),
 ('Armazenamento', [' ssd',' nvme',' hdd',' hd ',' m.2','sata iii',' 1tb',' 2tb',' 4tb','512gb','256gb','seagate','sandisk',' wd ','western digital']),
 ('Monitor', ['monitor',' ips ',' va ',' 144hz',' 165hz',' 180hz',' 75hz','ultrawide',' curvo','polegadas']),
 ('Notebook', ['notebook','laptop','ultrabook','macbook','ideapad','thinkpad','vivobook','chromebook']),
 ('Periféricos', ['teclado',' mouse','headset',' fone ','webcam','microfone','mousepad','gamepad','controle ']),
 ('Fonte/Gabinete/Cooler', [' fonte ',' psu ','gabinete',' cooler','water cooler','watercooler','ventoinha',' fan ','air cooler','80 plus']),
 ('TV', ['smart tv',' tv ','televis','soundbar']),
 ('Celular', ['smartphone','celular',' iphone',' galaxy',' xiaomi',' redmi',' poco ','moto g','moto e','realme']),
 ('Áudio', ['caixa de som',' jbl','echo dot','alexa',' earbud',' tws ',' airpods']),
 ('Cadeira/Mesa', [' cadeira','mesa gamer','mesa de escritório','mesa de escritorio']),
 ('PC/Kit', ['kit upgrade',' combo ','pc gamer','computador completo','setup completo','pc completo']),
 ('Cupom', [' cupom','cupons',' voucher','código de desconto','codigo de desconto']),
]

STORES = [
 ('amazon','Amazon'),('amzn','Amazon'),('magazineluiza','Magalu'),('magazinevoce','Magalu'),('magalu','Magalu'),
 ('aliexpress','AliExpress'),('kabum','KaBuM!'),('pichau','Pichau'),('terabyte','Terabyte'),
 ('mercadolivre','Mercado Livre'),('mercadolibre','Mercado Livre'),('/mlb','Mercado Livre'),('shopee','Shopee'),
 ('casasbahia','Casas Bahia'),('americanas','Americanas'),('fastshop','Fast Shop'),('pontofrio','Ponto'),
 ('bambulab','Bambu Lab'),('carrefour','Carrefour'),('samsung','Samsung'),('dell','Dell'),('lenovo','Lenovo'),
]

def classify(t):
    s=(' '+t.lower()+' ').replace('\n',' ')
    for name,kws in CATS:
        for k in kws:
            if k in s: return name
    return 'Outros'

def parse_price(text):
    pat=re.compile(r'R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d{2,})')
    cands=[(m.start(), m.group(1)) for m in pat.finditer(text)]
    if not cands: return None
    def norm(v):
        v=v.replace('.','').replace(',','.')
        try: return round(float(v),2)
        except: return None
    # prefere preço perto de "por/pix/vista/valor/à vista"
    low=text.lower()
    for pos,v in cands:
        ctx=low[max(0,pos-14):pos]
        if any(k in ctx for k in ['por','pix','vista','valor','apenas','sai ']):
            p=norm(v)
            if p: return p
    p=norm(cands[0][1])
    return p

def detect_store(text, link):
    hay=(link+' '+text).lower()
    for key,name in STORES:
        if key in hay: return name
    return '—'

def first_link(text, channel, mid):
    urls=re.findall(r'https?://[^\s)]+', text)
    for u in urls:
        if 't.me' not in u and 'telegram' not in u:
            return u.rstrip('.,);')
    return f'https://t.me/{channel}/{mid}'

def detect_coupon(text):
    m=re.search(r'(?:cupom|código|codigo)\s*[:\-]?\s*([A-Z0-9]{4,16})', text, re.I)
    if m and any(c.isdigit() for c in m.group(1)) or (m and m.group(1).isupper()):
        return m.group(1)
    return None

def title_of(text):
    for line in text.split('\n'):
        s=re.sub(r'\s+',' ',line).strip()
        # tira URLs soltas do título
        s=re.sub(r'https?://\S+','',s).strip(' •-·|')
        if len(s)>=6: return s[:140]
    return ''

def convert():
    grand=0
    per_cat={}
    for d,canal,uname in CHANNELS:
        jf=os.path.join(SRC,d,'messages.jsonl')
        if not os.path.exists(jf):
            print('  (pulando, sem dados):',d); continue
        out=[]; i=0
        for line in open(jf,encoding='utf-8'):
            try: m=json.loads(line)
            except: continue
            txt=(m.get('text') or '').strip()
            if len(txt)<6: continue  # pula mídia/vazio
            i+=1
            link=first_link(txt, uname, m.get('id'))
            cat=classify(txt)
            out.append({
                'id_visual': i,
                'produto': title_of(txt) or '(sem título)',
                'categoria': cat,
                'preco': parse_price(txt),
                'loja': detect_store(txt, link),
                'canal': canal,
                'data': (m.get('date') or '')[:10],
                'link': link,
                'cupom': detect_coupon(txt),
                'texto': txt[:1000],
            })
            per_cat[cat]=per_cat.get(cat,0)+1
        slug=uname.lower()
        with open(os.path.join(DADOS, f'{slug}.json'),'w',encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False)
        grand+=len(out)
        print(f'  {canal}: {len(out)} ofertas -> dados/{slug}.json')
    print(f'\nTOTAL: {grand} ofertas')
    print('Por categoria:')
    for c,n in sorted(per_cat.items(), key=lambda x:-x[1]):
        print(f'  {c}: {n}')

if __name__=='__main__':
    # remove os JSONs antigos (mercado)
    for old in glob.glob(os.path.join(DADOS,'*.json')):
        os.remove(old)
    print('dados antigos (mercado) removidos.')
    convert()
