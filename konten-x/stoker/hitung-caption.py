"""Count every caption in caption.md the way X does and fill the count into its heading.

Posts may be 280, the bio 160. Placeholders are counted at their worst case:
[CA] = a 42-character address, [LINK TX] and links = 23, [JUMLAH] = 15, short ones = 20.
"""
import re
from pathlib import Path

PATH = Path(__file__).with_name("caption.md")
PLACEHOLDER = {"[CA]": "x" * 42, "[LINK TX]": "https://t.co/xxxxxxxxxx", "[JUMLAH]": "x" * 15}


def weight(ch: str) -> int:
    # X's twitter-text: these ranges count 1, everything else (emoji, CJK, …, →) counts 2
    c = ord(ch)
    return 1 if c <= 4351 or 8192 <= c <= 8205 or 8208 <= c <= 8223 or 8242 <= c <= 8247 else 2


def x_length(text: str) -> int:
    for k, v in PLACEHOLDER.items():
        text = text.replace(k, v)
    text = re.sub(r"\[[^\]]+\]", "x" * 20, text)
    text = re.sub(r"(https?://\S+|\b[\w-]+\.(?:fun|com|xyz|rip|co)\b\S*)", "x" * 23, text)
    return sum(weight(c) for c in text)


src = PATH.read_text(encoding="utf-8")
out, ok = [], True
for block in re.split(r"(?m)^(?=## )", src):
    m = re.match(r"## ((?:Bio X|Post: [^\n]*?))(?: \((?:\{c\}|\{bio\}|\d+/\d+)\))?\n", block)
    if not m:
        out.append(block)
        continue
    body = block[m.end():].split("\n---")[0]
    if m.group(1) == "Bio X":
        body = body.split("\n\n")[0]
    limit = 160 if m.group(1) == "Bio X" else 280
    n = x_length(body.strip())
    ok &= n <= limit
    print(f"{'OK ' if n <= limit else 'TOO LONG'} {n:>3}/{limit}  {m.group(1)}")
    out.append(f"## {m.group(1)} ({n}/{limit})\n" + block[m.end():])
PATH.write_text("".join(out), encoding="utf-8")
raise SystemExit(0 if ok else 1)
