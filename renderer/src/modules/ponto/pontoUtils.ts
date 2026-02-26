import type { TimeEvent } from './pontoTypes';

export function calculateWorkedMs(events: TimeEvent[]): number {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalMs = 0;
  let lastIn: Date | null = null;

  for (const ev of sorted) {
    const t = new Date(ev.timestamp);

    if (ev.type === 'IN') {
      lastIn = t;
    }

    if (ev.type === 'OUT' && lastIn) {
      totalMs += t.getTime() - lastIn.getTime();
      lastIn = null;
    }
  }

  return totalMs;
}

export function formatWorked(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function getStatus(events: TimeEvent[]): 'Trabalhando' | 'Fora' {
  if (events.length === 0) return 'Fora';

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const last = sorted[sorted.length - 1];

  return last.type === 'IN' ? 'Trabalhando' : 'Fora';
}