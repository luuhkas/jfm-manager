import type {
  AuditLog,
  Employee,
  EsocialRemuneracao,
  Holiday,
  HourBankEntry,
  MonthClosing,
  SalaryHistoryEntry,
  TimeAdjustment,
  TimeEvent,
  WorkOrder,
} from "./modules/ponto/pontoTypes";

export {};

declare global {
  interface Window {
    jfm: {
      database: {
        backup: () => Promise<{ canceled: boolean; filePath?: string }>;
        restore: () => Promise<{ canceled: boolean }>;
      };
      audit: {
        listByRange: (range: { startDate: string; endDate: string }) => Promise<AuditLog[]>;
      };
      employees: {
        list: () => Promise<Employee[]>;
        upsertMany: (employees: Employee[]) => Promise<boolean>;
        deleteIfUnused: (id: string) => Promise<boolean>;
      };
      ponto: {
        listByDate: (workDate: string) => Promise<TimeEvent[]>;
        listByRange: (range: { startDate: string; endDate: string }) => Promise<TimeEvent[]>;
        addEvent: (event: TimeEvent) => Promise<TimeEvent>;
        deleteEvent: (id: string) => Promise<boolean>;
        listAdjustmentsByRange: (range: { startDate: string; endDate: string }) => Promise<TimeAdjustment[]>;
        addAdjustment: (adjustment: TimeAdjustment) => Promise<TimeAdjustment>;
      };
      holidays: {
        listByRange: (range: { startDate: string; endDate: string }) => Promise<Holiday[]>;
        upsert: (holiday: Holiday) => Promise<Holiday>;
        delete: (id: string) => Promise<boolean>;
      };
      monthClosings: {
        get: (monthKey: string) => Promise<MonthClosing | null>;
        close: (closing: MonthClosing) => Promise<MonthClosing>;
        reopen: (monthKey: string) => Promise<boolean>;
      };
      hourBank: {
        listByEmployee: (employeeId: string) => Promise<HourBankEntry[]>;
        listAll: () => Promise<HourBankEntry[]>;
        add: (entry: HourBankEntry) => Promise<HourBankEntry>;
        delete: (id: string) => Promise<boolean>;
      };
      workOrders: {
        list: (filters?: { status?: string }) => Promise<WorkOrder[]>;
        upsert: (wo: WorkOrder) => Promise<WorkOrder>;
        delete: (id: string) => Promise<boolean>;
        nextNumber: () => Promise<string>;
      };
      settings: {
        get: (key: string) => Promise<string | null>;
        getAll: () => Promise<Record<string, string>>;
        set: (key: string, value: string) => Promise<boolean>;
        setMany: (entries: Record<string, string>) => Promise<boolean>;
      };
      pdf: {
        generate: (payload: { html: string; filename: string }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>;
      };
      esocial: {
        generateS1200: (payload: {
          competencia: string;
          empregador: { cnpj: string; cpfResponsavel?: string; tpInsc?: string };
          remuneracoes: EsocialRemuneracao[];
        }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>;
      };
      salaryHistory: {
        listByEmployee: (employeeId: string) => Promise<SalaryHistoryEntry[]>;
      };
    };
  }
}
