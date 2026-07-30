# -*- coding: utf-8 -*-
# Baixa o historico publico de um canal Telegram via a visao web t.me/s/<canal>.
# So funciona para canais PUBLICOS (sem login). Pagina com ?before=<id>.
import sys, re, os, time, json, html, urllib.request

CHANNEL = 'pcdofafapromo'
MAX = 1200
SINCE = None  # 'YYYY-MM-DD'
RESUME = False
for a in sys.argv[1:]:
    if a.startswith('--channel='): CHANNEL=a.split('=',1)[1]
    if a.startswith('--max='): MAX=int(a.split('=',1)[1])
    if a.startswith('--since='): SINCE=a.split('=',1)[1]
    if a=='--resume': RESUME=True
OUTDIR = os.path.expanduser('~/Downloads/02-Pessoal/AI-Outputs/telegram-'+CHANNEL.lower())
os.makedirs(OUTDIR, exist_ok=True)

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
def fetch(before=None, tries=5):
    url=f'https://t.me/s/{CHANNEL}'+(f'?before={before}' if before else '')
    last=None
    for i in range(tries):
        try:
            req=urllib.request.Request(url, headers={'User-Agent':UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read().decode('utf-8','replace')
        except Exception as e:
            last=e
            time.sleep(4*(i+1))  # backoff: 4,8,12,16s (rate-limit/queda transitória)
    raise last

def clean_text(frag):
    frag=re.sub(r'<br\s*/?>', '\n', frag)
    frag=re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', lambda m: f'{re.sub("<[^>]*>","",m.group(2))} ({m.group(1)})', frag, flags=re.S)
    frag=re.sub(r'<[^>]+>', '', frag)
    return html.unescape(frag).strip()

def parse(page):
    msgs=[]
    chunks=page.split('tgme_widget_message_wrap')[1:]
    for c in chunks:
        mid=re.search(r'data-post="'+re.escape(CHANNEL)+r'/(\d+)"', c)
        if not mid: continue
        dt=re.search(r'<time[^>]*datetime="([^"]+)"', c)
        tx=re.search(r'tgme_widget_message_text[^>]*>(.*?)</div>', c, re.S)
        views=re.search(r'tgme_widget_message_views">([^<]*)</span>', c)
        msgs.append({
            'id':int(mid.group(1)),
            'date':(dt.group(1) if dt else ''),
            'views':(views.group(1) if views else ''),
            'text':(clean_text(tx.group(1)) if tx else ''),
        })
    # dedup + ordena
    seen={};
    for m in msgs: seen[m['id']]=m
    return sorted(seen.values(), key=lambda x:x['id'])

def main():
    all_msgs={}
    before=None
    pages=0
    if RESUME:
        jf=os.path.join(OUTDIR,'messages.jsonl')
        if os.path.exists(jf):
            for l in open(jf,encoding='utf-8'):
                try: m=json.loads(l); all_msgs[m['id']]=m
                except: pass
            if all_msgs:
                before=min(all_msgs)
                print(f'[tg] RESUME: {len(all_msgs)} já em disco; continuando antes de id {before}', flush=True)
    print(f'[tg] baixando @{CHANNEL} (max {MAX}, since {SINCE})...', flush=True)
    while len(all_msgs) < MAX:
        try:
            page=fetch(before)
        except Exception as e:
            print('[tg] erro fetch:', e, flush=True); break
        batch=parse(page)
        if not batch:
            print('[tg] fim (sem mais mensagens)', flush=True); break
        new=0
        for m in batch:
            if m['id'] not in all_msgs:
                all_msgs[m['id']]=m; new+=1
        pages+=1
        minid=min(m['id'] for m in batch)
        oldest_date=min((m['date'] for m in batch if m['date']), default='')
        print(f'[tg] pag {pages}: +{new} (total {len(all_msgs)}) ate id {minid} data {oldest_date[:10]}', flush=True)
        # cutoff por data
        if SINCE and oldest_date and oldest_date[:10] < SINCE:
            print('[tg] atingiu a data de corte', flush=True); break
        if new==0 or minid<=1:
            break
        before=minid
        time.sleep(0.9)
    # salva
    ordered=sorted(all_msgs.values(), key=lambda x:x['id'])
    if SINCE:
        ordered=[m for m in ordered if (m['date'][:10]>=SINCE if m['date'] else True)]
    with open(os.path.join(OUTDIR,'messages.jsonl'),'w',encoding='utf-8') as f:
        for m in ordered: f.write(json.dumps(m,ensure_ascii=False)+'\n')
    with open(os.path.join(OUTDIR,'messages.md'),'w',encoding='utf-8') as f:
        f.write(f'# Telegram @{CHANNEL} — historico ({len(ordered)} mensagens)\n\n')
        for m in ordered:
            f.write(f'### #{m["id"]} · {m["date"][:19].replace("T"," ")} · {m["views"]} views\n\n')
            f.write((m['text'] or '_(sem texto / mídia)_')+'\n\n')
            f.write(f'https://t.me/{CHANNEL}/{m["id"]}\n\n---\n\n')
    dates=[m['date'][:10] for m in ordered if m['date']]
    with open(os.path.join(OUTDIR,'summary.txt'),'w',encoding='utf-8') as f:
        f.write(f'canal: @{CHANNEL}\nmensagens: {len(ordered)}\npaginas: {pages}\n')
        if dates: f.write(f'periodo: {min(dates)} a {max(dates)}\n')
    print(f'[tg] PRONTO: {len(ordered)} msgs' + (f' | {min(dates)}..{max(dates)}' if dates else ''), flush=True)
    print('[tg] arquivos em', OUTDIR, flush=True)

if __name__=='__main__': main()
