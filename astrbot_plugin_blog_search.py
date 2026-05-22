import re, aiohttp, json, random
from astrbot.api.event import filter, AstrMessageEvent

SITE = "https://restartyhn.top"
INDEX_URL = f"{SITE}/search-index.json"
MEMOS_URL = f"{SITE}/memos/"

@filter.command("帮助")
async def blog_help(event: AstrMessageEvent):
    yield event.plain_result("""📚 博客助手命令：
/查询 <关键词> — 搜索博客内容
/最新 — 最新文章
/碎碎念 — 最新碎碎念
/关于 — 网站介绍
/问 <问题> — AI 回答博客相关问题
直接发博客链接 — AI 总结文章""")

@filter.command("查询")
async def blog_search(event: AstrMessageEvent, kw: str = ""):
    if not kw: yield event.plain_result("用法：/查询 <关键词>"); return
    async with aiohttp.ClientSession() as s:
        async with s.get(INDEX_URL) as r: docs = json.loads(await r.text())
    matches = [d for d in docs if kw.lower() in (d.get("content","")+d.get("title","")).lower()][:5]
    if not matches: yield event.plain_result(f"未找到关于「{kw}」的内容"); return
    ctx = "\n".join(f"- {d['title']}\n  {d.get('content','')[:120]}\n  {SITE}{d['url']}" for d in matches)
    yield event.plain_result(f"🔍 关于「{kw}」找到 {len(matches)} 条：\n\n{ctx}")

@filter.command("最新")
async def blog_latest(event: AstrMessageEvent):
    async with aiohttp.ClientSession() as s:
        async with s.get(INDEX_URL) as r: docs = json.loads(await r.text())
    posts = [d for d in docs if d.get("type") == "post"][:5]
    ctx = "\n".join(f"📄 {d['title']}\n  {SITE}{d['url']}" for d in posts)
    yield event.plain_result(f"📰 最新文章：\n\n{ctx}")

@filter.command("碎碎念")
async def blog_memos(event: AstrMessageEvent):
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{SITE}/memos.json") as r:
            memos = json.loads(await r.text())
    if not memos:
        yield event.plain_result("暂无碎碎念")
        return
    result = "💬 最新碎碎念：\n\n"
    for i in range(min(2, len(memos))):
        text = memos[i].get("body","").strip()[:120]
        result += f"🕐 {memos[i]['date']}\n{text}...\n\n" if text else f"🕐 {memos[i]['date']}\n\n"
    result += MEMOS_URL
    yield event.plain_result(result)

@filter.command("随机")
async def blog_random(event: AstrMessageEvent):
    async with aiohttp.ClientSession() as s:
        async with s.get(INDEX_URL) as r: docs = json.loads(await r.text())
    posts = [d for d in docs if d.get("type") in ("post","appreciation","gallery-work","memo","gallery-author") and d.get("url","")]
    if not posts: yield event.plain_result("暂无内容"); return
    p = random.choice(posts)
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{SITE}{p['url']}") as r:
            html = await r.text()
    title = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    paras = re.findall(r'<p[^>]*>([^<]{30,})</p>', html)
    content = " ".join(paras[:5])[:800] if paras else p.get("content","")[:800]
    summary = await event.request_llm(f"请用100字左右简洁总结这篇文章的内容：\n\n{content}")
    yield event.plain_result(f"🎲 随机推荐：\n\n📄 {title.group(1) if title else p['title']}\n\n🤖 AI 总结：{summary}\n\n{SITE}{p['url']}")

@filter.command("关于")
async def blog_about(event: AstrMessageEvent):
    async with aiohttp.ClientSession() as s:
        async with s.get(INDEX_URL) as r: docs = json.loads(await r.text())
    about = [d for d in docs if "about" in (d.get("url",""))]
    if about:
        yield event.plain_result(f"ℹ️ {about[0]['title']}\n{about[0].get('content','')[:200]}\n{SITE}{about[0]['url']}")
    else:
        yield event.plain_result(f"{SITE}/about/")

@filter.on_message_event()
async def blog_url_parser(event: AstrMessageEvent):
    msg = event.get_message_str()
    urls = re.findall(r'(https?://restartyhn\.top/[^\s]+)', msg)
    if not urls: return
    for url in urls[:1]:
        async with aiohttp.ClientSession() as s:
            async with s.get(url) as r:
                html = await r.text()
        title = re.search(r'<title>(.+?)</title>', html)
        h1 = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        content = re.findall(r'<p[^>]*>([^<]{20,})</p>', html)
        summary = " ".join(content[:3])[:300] if content else ""
        result = f"📄 {title.group(1) if title else (h1.group(1) if h1 else url)}\n{summary}\n\n{url}"
        yield event.plain_result(result)

@filter.command("问")
async def blog_ai_ask(event: AstrMessageEvent, question: str = ""):
    if not question: yield event.plain_result("用法：/问 <问题>"); return
    async with aiohttp.ClientSession() as s:
        async with s.get(INDEX_URL) as r: docs = json.loads(await r.text())
    matches = [d for d in docs if any(w in (d.get("content","")+d.get("title","")).lower() for w in question.split())][:3]
    if not matches: yield event.plain_result("未找到相关内容"); return
    ctx = ""
    for d in matches:
        ctx += f"【{d['title']}】{d.get('content','')[:200]}\n来源：{SITE}{d['url']}\n\n"
    yield event.plain_result(f"📚 参考以下内容回答「{question}」：\n\n{ctx}")
