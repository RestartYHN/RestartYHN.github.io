export interface ParsedLyricLine {
  time: number;
  text: string;
}

export interface LyricLine {
  time: number;
  text: string;
  translation: string;
}

export interface ParsedLrc {
  lines: ParsedLyricLine[];
  offsetSec: number;
}

export function parseLrc(text?: string | null): ParsedLrc {
  if (!text) return { lines: [], offsetSec: 0 };

  // Trim BOM and normalize line endings
  const cleanText = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  // Offset may appear anywhere in the file, not necessarily alone on a line
  const offsetMatch = cleanText.match(/\[\s*offset\s*[:：]\s*([+-]?\d+)\s*\]/i);
  const offsetSec = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;

  const lines: ParsedLyricLine[] = [];

  // Support timestamps like [mm:ss], [mm:ss.xx], [mm:ss:ms], with optional spaces
  const timeTagRe = /\[\s*(\d+)\s*:\s*(\d{1,2})(?:\s*([:.])\s*(\d{1,3}))?\s*\]/g;

  cleanText.split("\n").forEach((rawLine) => {
    const line = String(rawLine || "").trim();
    if (!line) return;

    const tags = [...line.matchAll(timeTagRe)];
    if (!tags.length) return;

    const plainText = line.replace(timeTagRe, "").trim();
    if (
      /^(作[词曲]|编曲|混[音缩]|[词曲](\s*[:：])|Vocal\.|Chorus\.|Guitar|Bass|Drum|Key(board)?|Strings|Arrang|Compos|Lyric|Record|Mix|Master|Producer|Program)/i.test(
        plainText,
      )
    )
      return;

    tags.forEach((tag) => {
      const mm = Number(tag[1]);
      const ss = Number(tag[2]);
      const sep = tag[3];
      const frac = tag[4];
      let seconds = mm * 60 + ss;
      if (sep && frac !== undefined) {
        if (sep === ".") {
          // fractional part like .23 -> 0.23 seconds; length determines divisor
          seconds += Number(frac) / 10 ** String(frac).length;
        } else {
          // separator ':' treated as milliseconds (e.g. mm:ss:ms)
          seconds += Number(frac) / 1000;
        }
      }

      lines.push({
        time: Math.max(0, seconds + offsetSec),
        text: plainText,
      });
    });
  });

  lines.sort((a, b) => a.time - b.time);
  return { lines, offsetSec };
}

export function buildLyricLines(lyricText?: string | null, translationText?: string | null): LyricLine[] {
  const base = parseLrc(lyricText).lines;
  if (!base.length) {
    const raw = String(lyricText || "").trim();
    if (!raw) return [];
    return raw.split("\n").map((t) => ({
      time: Infinity,
      text: t.trim() || " ",
      translation: "",
    }));
  }

  const trans = parseLrc(translationText).lines;
  let transIdx = 0;
  const TOLERANCE_SEC = 0.45;

  return base.map((line) => {
    let matched = "";

    while (transIdx + 1 < trans.length && trans[transIdx + 1].time <= line.time) {
      transIdx += 1;
    }

    const candidates = [trans[transIdx - 1], trans[transIdx], trans[transIdx + 1]].filter(
      (item): item is ParsedLyricLine => Boolean(item),
    );
    let best: ParsedLyricLine | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (const item of candidates) {
      const delta = Math.abs(item.time - line.time);
      if (delta < bestDelta) {
        best = item;
        bestDelta = delta;
      }
    }

    if (best && bestDelta <= TOLERANCE_SEC && best.text && best.text !== "//") {
      matched = best.text;
    }

    return {
      time: line.time,
      text: line.text,
      translation: matched,
    };
  });
}

export function getActiveLyricIndex(lines: LyricLine[], currentTime: number): number {
  if (!lines.length) return -1;

  const t = currentTime + 0.03;
  if (t < lines[0].time) return -1;

  let active = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (t >= lines[i].time) active = i;
    else break;
  }

  // If many lines share exactly the same timestamp, keep the first one
  // to avoid jumping several lines on initial mobile sync.
  while (active > 0 && lines[active - 1].time === lines[active].time) {
    active -= 1;
  }

  return active;
}
