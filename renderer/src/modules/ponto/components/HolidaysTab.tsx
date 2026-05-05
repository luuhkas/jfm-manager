import type { FormEvent } from "react";
import type { Holiday } from "../pontoTypes";
import type { HolidayFormState } from "../pontoPageShared";
import { holidayScopeLabels } from "../pontoPageShared";

interface HolidaysTabProps {
  holidayForm: HolidayFormState;
  holidays: Holiday[];
  monthStartDate: string;
  monthEndDate: string;
  disabled: boolean;
  onSaveHoliday: (event: FormEvent<HTMLFormElement>) => void;
  onSetHolidayForm: (updater: (current: HolidayFormState) => HolidayFormState) => void;
  onRemoveHoliday: (holiday: Holiday) => void;
}

export function HolidaysTab({
  holidayForm,
  holidays,
  monthStartDate,
  monthEndDate,
  disabled,
  onSaveHoliday,
  onSetHolidayForm,
  onRemoveHoliday,
}: HolidaysTabProps) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, margin: "0 0 12px" }}>Feriados</h2>
      <form
        onSubmit={onSaveHoliday}
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          alignItems: "end",
          marginBottom: 12,
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--surface-soft)",
        }}
      >
        <label className="field-label">
          Data
          <input
            type="date"
            value={holidayForm.date}
            min={monthStartDate}
            max={monthEndDate}
            disabled={disabled}
            onChange={(event) => onSetHolidayForm((current) => ({ ...current, date: event.target.value }))}
          />
        </label>

        <label className="field-label">
          Nome
          <input
            value={holidayForm.name}
            disabled={disabled}
            onChange={(event) => onSetHolidayForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex.: Natal"
          />
        </label>

        <label className="field-label">
          Tipo
          <select
            value={holidayForm.scope}
            disabled={disabled}
            onChange={(event) =>
              onSetHolidayForm((current) => ({ ...current, scope: event.target.value as Holiday["scope"] }))
            }
          >
            {Object.entries(holidayScopeLabels).map(([scope, label]) => (
              <option key={scope} value={scope}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={disabled}>
          Salvar feriado
        </button>
      </form>

      {holidays.length === 0 ? (
        <div style={{ opacity: 0.75 }}>Nenhum feriado cadastrado nesta competência.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 10,
                background: "var(--surface)",
              }}
            >
              <span>
                <b>{holiday.date}</b> - {holiday.name} ({holidayScopeLabels[holiday.scope]})
              </span>
              <button type="button" disabled={disabled} onClick={() => onRemoveHoliday(holiday)}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
