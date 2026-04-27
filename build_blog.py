#!/usr/bin/env python3
"""Convert blog markdown files to HTML pages matching the site's style."""

import re
import os

BLOG_DIR = os.path.join(os.path.dirname(__file__), "blog")
OUT_DIR = os.path.dirname(__file__)

ARTICLES = [
    {
        "src": "amazon-seller-statistics-2025.md",
        "out": "amazon-seller-statistics-2025.html",
        "title": "Amazon Seller Statistics 2025: The Complete Data Guide",
        "description": "9.7M registered sellers, 1.9M active, $575B GMV. Every Amazon seller statistic that matters in 2025, with data tables and source citations.",
        "keywords": "Amazon seller statistics 2025, how many sellers on Amazon, Amazon marketplace data",
    },
    {
        "src": "amazon-fba-statistics-2025.md",
        "out": "amazon-fba-statistics-2025.html",
        "title": "Amazon FBA Statistics 2025: Adoption Rate, Revenue & Growth",
        "description": "82% of active Amazon sellers use FBA. Complete data on FBA adoption rates, revenue outcomes, and why it's become the default fulfillment model.",
        "keywords": "Amazon FBA statistics, FBA adoption rate, Fulfillment by Amazon data, Amazon FBA 2025",
    },
    {
        "src": "amazon-third-party-market-share.md",
        "out": "amazon-third-party-market-share.html",
        "title": "Amazon Third-Party Seller Market Share 2025: Key Data",
        "description": "Third-party sellers account for 60%+ of all Amazon sales and $575B in GMV. Complete data on Amazon's shift from retailer to marketplace.",
        "keywords": "Amazon third-party seller market share, Amazon 3P sellers, Amazon marketplace GMV",
    },
    {
        "src": "amazon-million-dollar-sellers.md",
        "out": "amazon-million-dollar-sellers.html",
        "title": "Amazon Million-Dollar Sellers 2025: 100,000 Hit $1M+",
        "description": "100,000 Amazon sellers generate $1M+ annually. 235 exceed $100M. Complete data on Amazon's top earners and what separates them from the rest.",
        "keywords": "Amazon million dollar sellers, Amazon seller revenue, how much do Amazon sellers make",
    },
    {
        "src": "amazon-seller-demographics-2025.md",
        "out": "amazon-seller-demographics-2025.html",
        "title": "Amazon Seller Demographics 2025: Countries & Categories",
        "description": "Chinese sellers are 59.9% of new Amazon registrations. Private label dominates at 67%. Full demographic breakdown of Amazon's 1.9M active sellers.",
        "keywords": "Amazon seller demographics, Amazon Chinese sellers, Amazon seller countries, Amazon seller business models 2025",
    },
    {
        "src": "amazon-marketplace-growth-history.md",
        "out": "amazon-marketplace-growth-history.html",
        "title": "Amazon Seller Growth 2010–2025: From 50K to 2.4M and Back",
        "description": "Amazon's active sellers peaked at 2.4M in 2021 and stabilized at 1.9M in 2025. New registrations fell 86% from peak. The complete 15-year growth story.",
        "keywords": "Amazon seller growth, Amazon marketplace history, Amazon seller statistics history",
    },
]

NAV_LINKS = [
    ("amazon-seller-statistics-2025.html", "Seller Statistics"),
    ("amazon-fba-statistics-2025.html", "FBA Statistics"),
    ("amazon-third-party-market-share.html", "3P Market Share"),
    ("amazon-million-dollar-sellers.html", "Million-Dollar Sellers"),
    ("amazon-seller-demographics-2025.html", "Demographics"),
    ("amazon-marketplace-growth-history.html", "Growth History"),
]


def parse_frontmatter(text):
    """Strip YAML frontmatter and return (meta_dict, body)."""
    if text.startswith("---"):
        end = text.index("---", 3)
        return text[end + 3:].strip()
    return text.strip()


def md_to_html(md):
    """Minimal markdown → HTML converter for the subset used in these articles."""
    lines = md.split("\n")
    html_lines = []
    in_table = False
    in_ul = False
    in_ol = False
    in_p = False
    table_header_done = False

    def close_open_blocks():
        nonlocal in_table, in_ul, in_ol, in_p, table_header_done
        if in_table:
            html_lines.append("</tbody></table>")
            in_table = False
            table_header_done = False
        if in_ul:
            html_lines.append("</ul>")
            in_ul = False
        if in_ol:
            html_lines.append("</ol>")
            in_ol = False
        if in_p:
            html_lines.append("</p>")
            in_p = False

    def inline(text):
        # bold
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        # italic
        text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
        # inline code
        text = re.sub(r'`(.+?)`', r'<code>\1</code>', text)
        # links — convert .md refs to .html
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\.md\)', r'<a href="\2.html">\1</a>', text)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
        return text

    i = 0
    while i < len(lines):
        line = lines[i]

        # Horizontal rule
        if re.match(r'^---+$', line.strip()):
            close_open_blocks()
            html_lines.append('<hr>')
            i += 1
            continue

        # Headings
        h_match = re.match(r'^(#{1,4})\s+(.*)', line)
        if h_match:
            close_open_blocks()
            level = len(h_match.group(1))
            text = inline(h_match.group(2))
            slug = re.sub(r'[^a-z0-9]+', '-', h_match.group(2).lower()).strip('-')
            html_lines.append(f'<h{level} id="{slug}">{text}</h{level}>')
            i += 1
            continue

        # Table row
        if line.strip().startswith('|'):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            # separator row
            if all(re.match(r'^[-:]+$', c) for c in cells if c):
                if not in_table:
                    # retroactively wrap previous row as thead
                    last = html_lines.pop()
                    html_lines.append('<table><thead>' + last + '</thead><tbody>')
                    in_table = True
                    table_header_done = True
                i += 1
                continue
            row_html = '<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in cells if c != '') + '</tr>'
            if not in_table:
                html_lines.append(row_html)
            else:
                html_lines.append(row_html)
            i += 1
            continue
        else:
            if in_table:
                html_lines.append("</tbody></table>")
                in_table = False
                table_header_done = False

        # Ordered list
        ol_match = re.match(r'^\d+\.\s+(.*)', line)
        if ol_match:
            if in_p:
                html_lines.append("</p>")
                in_p = False
            if in_ul:
                html_lines.append("</ul>")
                in_ul = False
            if not in_ol:
                html_lines.append("<ol>")
                in_ol = True
            html_lines.append(f'<li>{inline(ol_match.group(1))}</li>')
            i += 1
            continue
        else:
            if in_ol:
                html_lines.append("</ol>")
                in_ol = False

        # Unordered list
        ul_match = re.match(r'^[-*]\s+(.*)', line)
        if ul_match:
            if in_p:
                html_lines.append("</p>")
                in_p = False
            if not in_ul:
                html_lines.append("<ul>")
                in_ul = True
            html_lines.append(f'<li>{inline(ul_match.group(1))}</li>')
            i += 1
            continue
        else:
            if in_ul:
                html_lines.append("</ul>")
                in_ul = False

        # Blank line
        if line.strip() == "":
            close_open_blocks()
            i += 1
            continue

        # Italic-only line (e.g. *Data reflects...*)
        if line.strip().startswith('*') and line.strip().endswith('*') and not line.strip().startswith('**'):
            close_open_blocks()
            html_lines.append(f'<p class="footnote">{inline(line.strip())}</p>')
            i += 1
            continue

        # Regular paragraph text
        if not in_p:
            html_lines.append("<p>")
            in_p = True
        html_lines.append(inline(line.strip()))
        i += 1

    close_open_blocks()
    return "\n".join(html_lines)


def build_nav(current_out):
    items = []
    for href, label in NAV_LINKS:
        active = ' class="active"' if href == current_out else ''
        items.append(f'<a href="../{href}"{active}>{label}</a>')
    return "\n".join(items)


def build_page(article):
    src_path = os.path.join(BLOG_DIR, article["src"])
    with open(src_path, encoding="utf-8") as f:
        raw = f.read()

    body_md = parse_frontmatter(raw)
    body_html = md_to_html(body_md)
    nav = build_nav(article["out"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{article['title']}</title>
    <meta name="description" content="{article['description']}">
    <meta name="keywords" content="{article['keywords']}">
    <link rel="canonical" href="https://rhythmfromwithin.github.io/marketplace-statistics/{article['out']}">
    <meta property="og:title" content="{article['title']}">
    <meta property="og:description" content="{article['description']}">
    <meta property="og:type" content="article">
    <style>
        *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.7;
        }}

        /* Top nav */
        .site-nav {{
            background: #232f3e;
            padding: 0 24px;
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
            min-height: 52px;
        }}
        .site-nav .brand {{
            color: #ff9900;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            margin-right: 16px;
            white-space: nowrap;
        }}
        .site-nav a {{
            color: rgba(255,255,255,0.75);
            text-decoration: none;
            font-size: 13px;
            padding: 6px 10px;
            border-radius: 4px;
            transition: background 0.15s, color 0.15s;
            white-space: nowrap;
        }}
        .site-nav a:hover, .site-nav a.active {{
            background: rgba(255,153,0,0.15);
            color: #ff9900;
        }}

        /* Layout */
        .page-wrap {{
            max-width: 860px;
            margin: 40px auto;
            padding: 0 24px 80px;
        }}

        /* Article */
        article {{
            background: white;
            border-radius: 10px;
            padding: 48px 56px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }}

        article h1 {{
            font-size: 2rem;
            font-weight: 800;
            color: #232f3e;
            line-height: 1.25;
            margin-bottom: 20px;
        }}
        article h2 {{
            font-size: 1.35rem;
            font-weight: 700;
            color: #232f3e;
            margin: 40px 0 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #ff9900;
        }}
        article h3 {{
            font-size: 1.1rem;
            font-weight: 700;
            color: #232f3e;
            margin: 28px 0 8px;
        }}
        article h4 {{
            font-size: 1rem;
            font-weight: 600;
            color: #444;
            margin: 20px 0 6px;
        }}

        article p {{
            margin-bottom: 16px;
            color: #333;
        }}
        article p.footnote {{
            font-size: 13px;
            color: #888;
            margin-top: 32px;
        }}

        article ul, article ol {{
            margin: 12px 0 20px 24px;
        }}
        article li {{
            margin-bottom: 6px;
            color: #333;
        }}

        article hr {{
            border: none;
            border-top: 1px solid #eee;
            margin: 36px 0;
        }}

        article strong {{ color: #232f3e; }}

        /* Tables */
        article table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0 28px;
            font-size: 14px;
        }}
        article thead tr {{
            background: #232f3e;
            color: white;
        }}
        article thead td {{
            padding: 10px 14px;
            font-weight: 600;
            text-align: left;
        }}
        article tbody tr:nth-child(even) {{ background: #f9f9f9; }}
        article tbody tr:hover {{ background: #fff8ee; }}
        article tbody td {{
            padding: 9px 14px;
            border-bottom: 1px solid #eee;
            color: #333;
        }}

        /* Links */
        article a {{
            color: #146eb4;
            text-decoration: none;
        }}
        article a:hover {{ text-decoration: underline; }}

        /* Back link */
        .back-link {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #666;
            text-decoration: none;
            font-size: 14px;
            margin-bottom: 20px;
        }}
        .back-link:hover {{ color: #232f3e; }}

        @media (max-width: 640px) {{
            article {{ padding: 28px 20px; }}
            article h1 {{ font-size: 1.5rem; }}
            article table {{ font-size: 12px; }}
            article thead td, article tbody td {{ padding: 7px 8px; }}
        }}
    </style>
</head>
<body>

<nav class="site-nav">
    <a href="../index.html" class="brand">Marketplace Stats</a>
    {nav}
</nav>

<div class="page-wrap">
    <a href="../index.html" class="back-link">← Back to Dashboard</a>
    <article>
        {body_html}
    </article>
</div>

</body>
</html>"""


if __name__ == "__main__":
    for article in ARTICLES:
        html = build_page(article)
        out_path = os.path.join(OUT_DIR, article["out"])
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"✓ {article['out']}")
    print("Done.")
