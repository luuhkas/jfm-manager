import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Employee, TimeAdjustment } from "../pontoTypes";
import { timeEventTypeLabels } from "../pontoPageShared";
import { adjustmentFormSchema, type AdjustmentFormValues } from "../forms";

interface AdjustmentsTabProps {
  adjustments: TimeAdjustment[];
  employees: Employee[];
  monthStartDate: string;
  monthEndDate: string;
  workDate: string;
  disabled: boolean;
  onSaveAdjustment: (values: AdjustmentFormValues) => Promise<boolean>;
}

export function AdjustmentsTab({
  adjustments,
  employees,
  monthStartDate,
  monthEndDate,
  workDate,
  disabled,
  onSaveAdjustment,
}: AdjustmentsTabProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      employeeId: employees[0]?.id ?? "",
      workDate,
      time: "08:00",
      type: "IN",
      reason: "",
    },
  });

  /* data selecionada no topbar vira o padrão do ajuste */
  useEffect(() => {
    setValue("workDate", workDate);
  }, [workDate, setValue]);

  const submit = handleSubmit(async (values) => {
    const ok = await onSaveAdjustment(values);
    if (ok) {
      reset({ ...values, reason: "" });
      setOpen(false);
    }
  });

  if (employees.length === 0) return null;

  return (
    <section>
      {/* ── Cabeçalho ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: open ? 12 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>Ajustes manuais</span>
          {adjustments.length > 0 ? (
            <span className="badge badge-neutral">{adjustments.length}</span>
          ) : null}
        </div>
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          style={{ fontSize: 12 }}
        >
          {open ? "Cancelar" : "+ Novo ajuste"}
        </button>
      </div>

      {/* ── Formulário ── */}
      {open ? (
        <form
          onSubmit={submit}
          noValidate
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            alignItems: "start",
            padding: 14,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--surface-soft)",
            marginBottom: 12,
          }}
        >
          <label className="field-label">
            Funcionário
            <select {...register("employeeId")} disabled={disabled} aria-invalid={!!errors.employeeId}>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            {errors.employeeId ? <span className="field-error">{errors.employeeId.message}</span> : null}
          </label>

          <label className="field-label">
            Data
            <input type="date" {...register("workDate")} min={monthStartDate} max={monthEndDate} disabled={disabled} />
          </label>

          <label className="field-label">
            Hora
            <input type="time" {...register("time")} disabled={disabled} />
          </label>

          <label className="field-label">
            Tipo
            <select {...register("type")} disabled={disabled}>
              <option value="IN">{timeEventTypeLabels.IN}</option>
              <option value="OUT">{timeEventTypeLabels.OUT}</option>
            </select>
          </label>

          <label className="field-label" style={{ gridColumn: "span 2" }}>
            Motivo
            <input
              {...register("reason")}
              disabled={disabled}
              placeholder="Ex.: funcionário esqueceu de registrar saída"
              autoFocus
              aria-invalid={!!errors.reason}
            />
            {errors.reason ? <span className="field-error">{errors.reason.message}</span> : null}
          </label>

          <button type="submit" disabled={disabled || isSubmitting} style={{ alignSelf: "end" }}>
            Salvar ajuste
          </button>
        </form>
      ) : null}

      {/* ── Últimos ajustes ── */}
      {adjustments.length > 0 ? (
        <div style={{ display: "grid", gap: 5 }}>
          {adjustments.slice(0, 6).map((adj) => {
            const emp = employees.find((e) => e.id === adj.employeeId);
            return (
              <div
                key={adj.id}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--r)",
                  padding: "8px 12px",
                  background: "var(--surface)",
                  fontSize: 12.5,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                  color: "var(--muted)",
                }}
              >
                <b style={{ color: "var(--text)" }}>{emp?.name ?? "—"}</b>
                <span>·</span>
                <span>{adj.workDate}</span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>{timeEventTypeLabels[adj.type]}</span>
                <span>{new Date(adj.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span>·</span>
                <span style={{ color: "var(--text)" }}>{adj.reason}</span>
              </div>
            );
          })}
          {adjustments.length > 6 ? (
            <div style={{ fontSize: 12, color: "var(--disabled)", paddingLeft: 4 }}>
              +{adjustments.length - 6} ajuste(s) anteriores no mês.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
