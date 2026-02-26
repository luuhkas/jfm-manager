export type TimeEventType = 'IN' | 'OUT';

export interface TimeEvent {
  id: string;
  employeeId: string;
  timestamp: string; // ISO string (mais fácil de salvar depois)
  workDate: string; // "YYYY-MM-DD"
  type: TimeEventType;
}

export interface Employee {
  id: string;
  name: string;
}

