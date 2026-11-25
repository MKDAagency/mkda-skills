#!/usr/bin/env python3
"""Make a Word document: one script per page, one tick box per line. No dependencies.

Usage: build_docx.py <scripts.json> <output.docx> [--lang en] [--labels "HOOK|MESSAGE|CLOSING|ALTERNATIVE"] [--font Arial]
"""
import argparse, json, os, sys, zipfile
from xml.sax.saxutils import escape, quoteattr

LABELS = {
    "en": "HOOK|MESSAGE|CLOSING|ALTERNATIVE", "it": "HOOK|MESSAGGIO|CHIUSURA|RISERVA",
    "es": "GANCHO|MENSAJE|CIERRE|ALTERNATIVA", "fr": "ACCROCHE|MESSAGE|CONCLUSION|ALTERNATIVE",
    "de": "HOOK|BOTSCHAFT|SCHLUSS|ALTERNATIVE", "pt": "GANCHO|MENSAGEM|FECHAMENTO|ALTERNATIVA",
}
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14"'
BOX = ('<w:sdt><w:sdtPr><w14:checkbox><w14:checked w14:val="0"/><w14:checkedState w14:val="2612" w14:font="MS Gothic"/>'
       '<w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/></w14:checkbox></w:sdtPr><w:sdtContent><w:r><w:rPr>'
       '<w:rFonts w:ascii="MS Gothic" w:eastAsia="MS Gothic" w:hAnsi="MS Gothic" w:hint="eastAsia"/><w:sz w:val="28"/></w:rPr>'
       '<w:t>☐</w:t></w:r></w:sdtContent></w:sdt>')


def document(data, labels, font):
    def rpr(size, bold=False):
        f = quoteattr(font)
        return f'<w:rPr><w:rFonts w:ascii={f} w:cs={f} w:eastAsia={f} w:hAnsi={f}/>{"<w:b/>" if bold else ""}<w:sz w:val="{size}"/></w:rPr>'

    def run(text, size, bold=False, tab=False):
        return f'<w:r>{rpr(size, bold)}{"<w:tab/>" if tab else ""}<w:t xml:space="preserve">{escape(str(text))}</w:t></w:r>'

    def para(text, size, bold=False, center=False, br=False, before=0, after=160):
        return (f'<w:p><w:pPr>{"<w:pageBreakBefore/>" if br else ""}<w:spacing w:before="{before}" w:after="{after}"/>'
                f'{"<w:jc w:val=" + chr(34) + "center" + chr(34) + "/>" if center else ""}</w:pPr>{run(text, size, bold)}</w:p>')

    def check(text):
        return ('<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="567"/></w:tabs><w:spacing w:after="220" w:line="340" w:lineRule="auto"/>'
                f'<w:ind w:left="567" w:hanging="567"/></w:pPr>{BOX}{run(text, 24, tab=True)}</w:p>')

    hook, msg, close, alt = labels
    total = sum(not str(s["n"]).upper().endswith("B") for s in data)
    out = []
    for i, s in enumerate(data):
        is_alt = str(s["n"]).upper().endswith("B")
        out.append(para(f'{s["n"]} {alt}' if is_alt else f'{s["n"]}/{total}', 16, br=i > 0))
        out.append(para(s["title"], 40, True, True, before=360, after=560))
        out += [para(hook, 24, True), check(s["hook"]), para(msg, 24, True, before=360)]
        out += [check(x) for x in s["body"]]
        out += [para(close, 24, True, before=360), check(s["closing"])]
    sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>'
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {W}><w:body>{"".join(out)}{sect}</w:body></w:document>'


def write(path, xml):
    if os.path.exists(path):
        sys.exit(f"{path} already exists: use a new version name")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr("word/document.xml", xml)


if __name__ == "__main__":
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("src"); a.add_argument("out")
    a.add_argument("--lang", default="en"); a.add_argument("--labels"); a.add_argument("--font", default="Arial")
    o = a.parse_args()
    labels = (o.labels or LABELS.get(o.lang[:2].lower(), "")).split("|")
    if len(labels) != 4:
        a.error("no labels for this language: pass --labels with 4 parts separated by |")
    try:
        xml = document(json.load(open(o.src, encoding="utf-8")), labels, o.font)
    except (OSError, ValueError, KeyError, TypeError) as e:
        sys.exit(f"cannot build: {e!r}. Run check.py first")
    write(o.out, xml)
    print("written", o.out)
