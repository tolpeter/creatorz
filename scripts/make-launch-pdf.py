# -*- coding: utf-8 -*-
"""LAUNCH.md -> polished A4 PDF with full Hungarian glyph support (Arial TTF)."""
import re, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONTS = r"C:\Windows\Fonts"
pdfmetrics.registerFont(TTFont("Body", os.path.join(FONTS, "arial.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold", os.path.join(FONTS, "arialbd.ttf")))
pdfmetrics.registerFont(TTFont("Body-It", os.path.join(FONTS, "ariali.ttf")))
mono_path = os.path.join(FONTS, "consola.ttf")
pdfmetrics.registerFont(TTFont("Mono", mono_path if os.path.exists(mono_path) else os.path.join(FONTS, "cour.ttf")))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-It", boldItalic="Body-Bold")

LIME = colors.HexColor("#4d7c0f")
DARK = colors.HexColor("#0a0a0a")
GREY = colors.HexColor("#666666")
LIGHT = colors.HexColor("#f0f4e5")
BORDER = colors.HexColor("#dddddd")

ss = getSampleStyleSheet()
def style(name, **kw):
    kw.setdefault("fontName", "Body")
    return ParagraphStyle(name, parent=ss["Normal"], **kw)

S = {
    "h1": style("h1", fontName="Body-Bold", fontSize=20, leading=25, textColor=DARK, spaceBefore=6, spaceAfter=10),
    "h2": style("h2", fontName="Body-Bold", fontSize=14.5, leading=19, textColor=LIME, spaceBefore=16, spaceAfter=6),
    "h3": style("h3", fontName="Body-Bold", fontSize=11.5, leading=15, textColor=DARK, spaceBefore=10, spaceAfter=4),
    "body": style("body", fontSize=9.5, leading=14, textColor=colors.HexColor("#222222"), spaceAfter=5),
    "quote": style("quote", fontSize=9.5, leading=14, textColor=GREY, leftIndent=10, borderPadding=(0,0,0,8)),
    "li": style("li", fontSize=9.5, leading=14, leftIndent=12, bulletIndent=2, spaceAfter=2),
    "code": style("code", fontName="Mono", fontSize=8.2, leading=11.5, textColor=colors.HexColor("#1a1a1a"),
                  backColor=colors.HexColor("#f5f5f5"), borderPadding=(6,6,6,6), spaceAfter=6, leftIndent=2),
    "cell": style("cell", fontSize=8.3, leading=11),
    "cellh": style("cellh", fontName="Body-Bold", fontSize=8.3, leading=11, textColor=colors.white),
}

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def inline(t):
    # 1) Kód-spanokat (`...`) félretesszük, hogy a **bold** ne nyúljon beléjük.
    codes = []
    def stash(m):
        codes.append(m.group(1))
        return "\x00%d\x00" % (len(codes) - 1)
    t = re.sub(r"`([^`]+?)`", stash, t)
    # 2) A maradékot escape-eljük, majd bold + linkek.
    t = esc(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2" color="#4d7c0f">\1</link>', t)
    # 3) Kód-spanok visszaillesztése (a tartalmuk escape-elve).
    t = re.sub(r"\x00(\d+)\x00",
               lambda m: '<font face="Mono" size="8.5">%s</font>' % esc(codes[int(m.group(1))]), t)
    return t

def main():
    src = open(r"C:\codex\Creatorz.hu\LAUNCH.md", encoding="utf-8").read()
    lines = src.split("\n")
    story = []
    i = 0
    n = len(lines)
    while i < n:
        ln = lines[i]
        # code block
        if ln.strip().startswith("```"):
            buf = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i]); i += 1
            i += 1
            code = esc("\n".join(buf)).replace(" ", "&nbsp;").replace("\n", "<br/>")
            story.append(Paragraph(code, S["code"]))
            continue
        # table
        if ln.strip().startswith("|") and i + 1 < n and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i+1]):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(lines[i]); i += 1
            cells = []
            for r_i, raw in enumerate(rows):
                if re.match(r"^\s*\|[\s:|-]+\|\s*$", raw):
                    continue
                parts = [c.strip() for c in raw.strip().strip("|").split("|")]
                st = S["cellh"] if r_i == 0 else S["cell"]
                cells.append([Paragraph(inline(p), st) for p in parts])
            if cells:
                ncol = len(cells[0])
                avail = 170 * mm
                tbl = Table(cells, colWidths=[avail / ncol] * ncol, repeatRows=1)
                tbl.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,0), DARK),
                    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#fafafa")]),
                    ("GRID", (0,0), (-1,-1), 0.4, BORDER),
                    ("VALIGN", (0,0), (-1,-1), "TOP"),
                    ("LEFTPADDING", (0,0), (-1,-1), 5),
                    ("RIGHTPADDING", (0,0), (-1,-1), 5),
                    ("TOPPADDING", (0,0), (-1,-1), 4),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ]))
                story.append(Spacer(1, 4)); story.append(tbl); story.append(Spacer(1, 8))
            continue
        # headings
        if ln.startswith("### "):
            story.append(Paragraph(inline(ln[4:]), S["h3"]))
        elif ln.startswith("## "):
            story.append(Paragraph(inline(ln[3:]), S["h2"]))
        elif ln.startswith("# "):
            story.append(Paragraph(inline(ln[2:]), S["h1"]))
        elif ln.strip() in ("---", "***", "___"):
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=0.6, color=BORDER))
            story.append(Spacer(1, 4))
        elif ln.startswith(">"):
            story.append(Paragraph(inline(ln.lstrip("> ").rstrip()), S["quote"]))
        elif re.match(r"^\s*- \[[ xX]\]\s", ln):
            done = re.match(r"^\s*- \[([ xX])\]", ln).group(1).lower() == "x"
            txt = re.sub(r"^\s*- \[[ xX]\]\s", "", ln)
            box = "☑" if done else "☐"
            story.append(Paragraph(inline(txt), S["li"], bulletText=box))
        elif re.match(r"^\s*[-*] ", ln):
            txt = re.sub(r"^\s*[-*] ", "", ln)
            story.append(Paragraph(inline(txt), S["li"], bulletText="•"))
        elif re.match(r"^\s*\d+\.\s", ln):
            num = re.match(r"^\s*(\d+)\.", ln).group(1)
            txt = re.sub(r"^\s*\d+\.\s", "", ln)
            story.append(Paragraph(inline(txt), S["li"], bulletText=num + "."))
        elif ln.strip() == "":
            story.append(Spacer(1, 3))
        else:
            story.append(Paragraph(inline(ln), S["body"]))
        i += 1

    out = r"C:\codex\Creatorz.hu\Creatorz-Elesitesi-Kezikonyv.pdf"
    doc = SimpleDocTemplate(out, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=18*mm,
                            title="Creatorz – Élesítési kézikönyv", author="Creatorz")
    doc.build(story)
    print("OK ->", out, os.path.getsize(out), "bytes")

main()
