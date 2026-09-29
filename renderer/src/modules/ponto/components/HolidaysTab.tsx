import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Holiday } from "../pontoTypes";
import { holidayScopeLabels } from "../pontoPageShared";
import { holidayFormSchema, type HolidayFormValues } from "../forms";

interface HolidaysTabProps {
  holidays: Holiday[];
  monthStartDate: string;
  monthEndDate: string;
  workDate: string;
  disabled: boolean;
  onSaveHoliday: (values: HolidayFormValues) => Promise<boolean>;
  onRemoveHoliday: (holiday: Holiday) => void;
}

export function HolidaysTab({
  holidays,
  monthStartDate,
  monthEndDate,
  workDate,
  disabled,
  onSaveHoliday,
  onRemoveHoliday,
}: HolidaysTabProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { date: workDate, name: "", scope: "company" },
  });

  /* segue a data/competência selecionada no topbar */
  useEffect(() => {
    setValue("date", workDate);
  }, [workDate, setValue]);

  const submit = handleSubmit(async (values) => {
    const ok = await onSaveHoliday(values);
    if (ok) reset({ ...values, name: "" });
  });

  return (
    <section style={{ marginBottom: 20 }}>
      <h2 className="section-title spaced">Feriados</h2>
      <form
        onSubmit={submit}
        noValidate
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          alignItems: "start",
          marginBottom: 12,
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-soft)",
        }}
      >
        <label className="field-label">
          Data
          <input
            type="date"
            {...register("date")}
            min={monthStartDate}
            max={monthEndDate}
            disabled={disabled}
            aria-invalid={!!errors.date}
          />
          {errors.date ? <span className="field-error">{errors.date.message}</span> : null}
        </label>

        <label className="field-label">
          Nome
          <input
            {...register("name")}
            disabled={disabled}
            placeholder="Ex.: Natal"
            aria-invalid={!!errors.name}
          />
          {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
        </label>

        <label className="field-label">
          Tipo
          <select {...register("scope")} disabled={disabled}>
            {Object.entries(holidayScopeLabels).map(([scope, label]) => (
              <option key={scope} value={scope}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={disabled || isSubmitting} style={{ alignSelf: "end" }}>
          Salvar feriado
        </button>
      </form>

      {holidays.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>Nenhum feriado cadastrado nesta competência.</div>
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
                borderRadius: "var(--r-md)",
                padding: 10,
                background: "var(--surface)",
              }}
            >
              <span>
                <b>{holiday.date}</b> - {holiday.name} ({holidayScopeLabels[holiday.scope]})
              </span>
              <button type="button" className="btn-sm" disabled={disabled} onClick={() => onRemoveHoliday(holiday)}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
