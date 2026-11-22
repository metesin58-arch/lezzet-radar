const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function istanbulNow(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

type Range = { start: number; end: number; allDay?: boolean };

function parseRanges(entries: string[] | undefined): Range[] | null {
  if (!entries) return null;
  const out: Range[] = [];
  for (const e of entries) {
    if (/24\s*saat/i.test(e) || /24 hours/i.test(e)) {
      out.push({ start: 0, end: 24 * 60, allDay: true });
      continue;
    }
    const m = e.match(/(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/);
    if (m) out.push({ start: +m[1] * 60 + +m[2], end: +m[3] * 60 + +m[4] });
  }
  return out;
}

/** Is the place open right now (Istanbul time)? Returns null when unknown. */
export function isOpenNow(openHours: Record<string, string[]> | null, now: Date): boolean | null {
  if (!openHours) return null;
  const { day, minutes } = istanbulNow(now);
  const today = parseRanges(openHours[DAYS[day]]);
  if (today === null) return null;
  for (const r of today) {
    if (r.allDay) return true;
    if (r.end > r.start ? minutes >= r.start && minutes < r.end : minutes >= r.start) return true;
  }
  const yesterday = parseRanges(openHours[DAYS[(day + 6) % 7]]) ?? [];
  return yesterday.some((r) => !r.allDay && r.end <= r.start && minutes < r.end);
}
