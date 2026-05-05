import { useState } from "react";
import type { Employee, WorkOrder, WorkOrderStatus } from "../pontoTypes";
import { emptyWorkOrderForm, workOrderStatusLabels, type WorkOrderFormState } from "../pontoPageShared";
import { formatMinutes } from "../pontoUtils";

interface WorkOrderTabProps {
  employees: Employee[];
  workOrders: WorkOrder[];
  onSave: (wo: WorkOrder) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onGetNextNumber: () => Promise<string>;
}

const statusColors: Record<WorkOrderStatus, string> = {
  open: "var(--accent)",
  in_progress: "#f5a623",
  completed: "var(--success)",
  cancelled: "var(--muted)",
};

export function WorkOrderTab({ employees, workOrders, onSave, onDelete, onGetNextNumber }: WorkOrderTabProps) {
  const [form, setForm] = useState<WorkOrderFormState>(emptyWorkOrderForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateForm(field: keyof WorkOrderFormState, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleEmployee(id: string) {
    setForm((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter((e) => e !== id)
        : [...prev.employeeIds, id],
    }));
  }

  async function handleNew() {
    try {
      const number = await onGetNextNumber();
      setForm({ ...emptyWorkOrderForm, number });
      setEditingId(null);
    } catch {
      setForm({ ...emptyWorkOrderForm });
      setEditingId(null);
    }
  }

  function handleEdit(wo: WorkOrder) {
    setForm({
      number: wo.number,
      clientName: wo.clientName,
      description: wo.description,
      status: wo.status,
      employeeIds: wo.employeeIds,
      estimatedMinutes: String(wo.estimatedMinutes),
      note: wo.note,
    });
    setEditingId(wo.id);
  }

  async function handleSave(evt: React.FormEvent) {
    evt.preventDefault();
    if (!form.number.trim()) { setError("Número da OS é obrigatório."); return; }
    if (!form.clientName.trim()) { setError("Nome do cliente é obrigatório."); return; }
    setError(null);
    setSaving(true);
    try {
      const wo: WorkOrder = {
        id: editingId ?? crypto.randomUUID(),
        number: form.number.trim(),
        clientName: form.clientName.trim(),
        description: form.description.trim(),
        status: form.status,
        employeeIds: form.employeeIds,
        estimatedMinutes: Math.round(parseFloat(form.estimatedMinutes) || 0),
        createdAt: workOrders.find((w) => w.id === editingId)?.createdAt ?? new Date().toISOString(),
        completedAt: form.status === "completed" ? (workOrders.find((w) => w.id === editingId)?.completedAt ?? new Date().toISOString()) : null,
        note: form.note.trim(),
      };
      await onSave(wo);
      setForm(emptyWorkOrderForm);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar OS.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(wo: WorkOrder) {
    if (!window.confirm(`Excluir OS ${wo.number}?`)) return;
    try {
      await onDelete(wo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir OS.");
    }
  }

  const filtered = workOrders.filter((wo) => {
    const matchStatus = filterStatus === "all" || wo.status === filterStatus;
    const matchSearch = !search || wo.clientName.toLowerCase().includes(search.toLowerCase()) || wo.number.toLowerCase().includes(search.toLowerCase()) || wo.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = workOrders.reduce((acc, wo) => {
    acc[wo.status] = (acc[wo.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Ordens de Serviço</h2>
          <div style={{ color: "var(--muted)" }}>
            {workOrders.length} OS — {counts.open ?? 0} abertas, {counts.in_progress ?? 0} em andamento, {counts.completed ?? 0} concluídas
          </div>
        </div>
        <button type="button" onClick={handleNew}>+ Nova OS</button>
      </div>

      {(form.number || editingId) ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 20, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px" }}>{editingId ? `Editar ${form.number}` : "Nova Ordem de Serviço"}</h3>
          {error ? <div style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div> : null}
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
              <label className="field-label">
                Número
                <input value={form.number} onChange={(e) => updateForm("number", e.target.value)} placeholder="OS-0001" />
              </label>
              <label className="field-label">
                Cliente
                <input value={form.clientName} onChange={(e) => updateForm("clientName", e.target.value)} placeholder="Nome do cliente" />
              </label>
              <label className="field-label">
                Status
                <select value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
                  {(Object.keys(workOrderStatusLabels) as WorkOrderStatus[]).map((s) => (
                    <option key={s} value={s}>{workOrderStatusLabels[s]}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Horas estimadas (min)
                <input type="number" value={form.estimatedMinutes} onChange={(e) => updateForm("estimatedMinutes", e.target.value)} placeholder="0" />
              </label>
            </div>
            <label className="field-label" style={{ display: "grid", marginBottom: 12 }}>
              Descrição do serviço
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Descreva o serviço a ser realizado..."
                rows={3}
                style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg)", color: "inherit", font: "inherit", resize: "vertical" }}
              />
            </label>
            <div style={{ marginBottom: 12 }}>
              <div className="field-label" style={{ marginBottom: 8 }}>Responsáveis</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {employees.filter((e) => e.active).map((emp) => (
                  <label key={emp.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "6px 12px", borderRadius: 8, border: `1px solid ${form.employeeIds.includes(emp.id) ? "var(--accent)" : "var(--border)"}`, background: form.employeeIds.includes(emp.id) ? "var(--surface-strong)" : "transparent" }}>
                    <input type="checkbox" checked={form.employeeIds.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} style={{ width: "auto" }} />
                    {emp.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="field-label" style={{ display: "grid", marginBottom: 14 }}>
              Observação
              <input value={form.note} onChange={(e) => updateForm("note", e.target.value)} placeholder="Observações adicionais" />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar OS"}</button>
              <button type="button" onClick={() => { setForm(emptyWorkOrderForm); setEditingId(null); setError(null); }}>Cancelar</button>
            </div>
          </form>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, número ou descrição..."
          style={{ flex: 1, minWidth: 220 }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as WorkOrderStatus | "all")}>
          <option value="all">Todos os status</option>
          {(Object.keys(workOrderStatusLabels) as WorkOrderStatus[]).map((s) => (
            <option key={s} value={s}>{workOrderStatusLabels[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        workOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1"/>
              </svg>
            </div>
            <h3>Nenhuma ordem de serviço</h3>
            <p>Crie a primeira OS para acompanhar serviços, atribuir responsáveis e registrar prazos.</p>
            <button type="button" onClick={handleNew}>+ Nova ordem de serviço</button>
          </div>
        ) : (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: "28px 16px", fontSize: 13.5 }}>
            Nenhuma OS corresponde ao filtro atual.
          </div>
        )
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((wo) => {
            const assignedNames = wo.employeeIds
              .map((id) => employees.find((e) => e.id === id)?.name)
              .filter(Boolean)
              .join(", ");
            return (
              <div
                key={wo.id}
                style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "var(--surface-soft)", display: "grid", gap: 8 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <b style={{ fontSize: "1rem" }}>{wo.number}</b>
                    <span style={{ color: statusColors[wo.status], fontWeight: 700, fontSize: "0.82rem", border: `1px solid ${statusColors[wo.status]}`, borderRadius: 999, padding: "2px 8px" }}>
                      {workOrderStatusLabels[wo.status]}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => handleEdit(wo)} style={{ fontSize: "0.82rem", padding: "4px 10px" }}>Editar</button>
                    <button type="button" onClick={() => handleDelete(wo)} style={{ fontSize: "0.82rem", padding: "4px 10px", color: "var(--danger)", borderColor: "var(--danger)" }}>Excluir</button>
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{wo.clientName}</div>
                {wo.description ? <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{wo.description}</div> : null}
                <div style={{ display: "flex", gap: 16, fontSize: "0.82rem", color: "var(--muted)", flexWrap: "wrap" }}>
                  {wo.estimatedMinutes > 0 ? <span>Estimado: {formatMinutes(wo.estimatedMinutes)}</span> : null}
                  {assignedNames ? <span>Responsáveis: {assignedNames}</span> : null}
                  <span>Criada em {new Date(wo.createdAt).toLocaleDateString("pt-BR")}</span>
                  {wo.completedAt ? <span>Concluída em {new Date(wo.completedAt).toLocaleDateString("pt-BR")}</span> : null}
                </div>
                {wo.note ? <div style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic" }}>{wo.note}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
