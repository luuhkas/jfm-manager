import { useState } from 'react';
import type { Employee, TimeEvent, TimeEventType } from './pontoTypes';
import { calculateWorkedMs, formatWorked, getStatus } from './pontoUtils';

const employeesMock: Employee[] = [
  { id: '1', name: 'João' },
  { id: '2', name: 'Carlos' },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function nowISO() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

export default function PontoPage() {
  const [events, setEvents] = useState<TimeEvent[]>([]);

  function employeeEventsToday(employeeId: string) {
    const key = todayKey();
    return events.filter(
      e => e.employeeId === employeeId && e.workDate === key
    );
  }

  function canRegister(employeeId: string, type: TimeEventType) {
    const evs = employeeEventsToday(employeeId).sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );

    const last = evs.at(-1);

    if (!last) return type === 'IN'; // primeiro do dia só pode ser IN
    if (last.type === 'IN') return type === 'OUT';
    return type === 'IN';
  }

  function register(employeeId: string, type: TimeEventType) {
    if (!canRegister(employeeId, type)) return;

    const ev: TimeEvent = {
      id: newId(),
      employeeId,
      timestamp: nowISO(),
      workDate: todayKey(),
      type,
    };

    setEvents(prev => [...prev, ev]);
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 16 }}>Ponto (Gerente)</h1>

      {employeesMock.map(emp => {
        const evs = employeeEventsToday(emp.id).sort(
          (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
        );

        const status = getStatus(evs);
        const workedMs = calculateWorkedMs(evs);

        const inEnabled = canRegister(emp.id, 'IN');
        const outEnabled = canRegister(emp.id, 'OUT');

        return (
          <div
            key={emp.id}
            style={{
              border: '1px solid #2b2b2b',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {emp.name}
                </div>

                <div style={{ opacity: 0.85 }}>
                  Status: <b>{status}</b>
                </div>

                <div style={{ opacity: 0.85 }}>
                  Horas (hoje):{' '}
                  <b>{formatWorked(workedMs)}</b>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() =>
                    register(emp.id, 'IN')
                  }
                  disabled={!inEnabled}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    cursor: inEnabled
                      ? 'pointer'
                      : 'not-allowed',
                  }}
                >
                  IN
                </button>

                <button
                  onClick={() =>
                    register(emp.id, 'OUT')
                  }
                  disabled={!outEnabled}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    cursor: outEnabled
                      ? 'pointer'
                      : 'not-allowed',
                  }}
                >
                  OUT
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Registros
              </div>

              {evs.length === 0 ? (
                <div style={{ opacity: 0.7 }}>
                  Sem registros ainda.
                </div>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                  }}
                >
                  {evs.map(e => (
                    <li key={e.id}>
                      <b>{e.type}</b> —{' '}
                      {new Date(
                        e.timestamp
                      ).toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}