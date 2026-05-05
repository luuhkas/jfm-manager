const fs = require("fs");

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function centsToDecimal(cents) {
  return (Math.round(cents) / 100).toFixed(2);
}

function generateS1200Xml({ competencia, empregador, remuneracoes }) {
  const [ano, mes] = competencia.split("-");
  const items = remuneracoes.map((r) => `
    <evtRemun>
      <ideEvento>
        <indRetif>1</indRetif>
        <perApur>${esc(competencia)}</perApur>
        <indApuracao>1</indApuracao>
        <indGuia>1</indGuia>
        <tpAmb>1</tpAmb>
        <procEmi>1</procEmi>
        <verProc>1.0</verProc>
      </ideEvento>
      <ideEmpregador>
        <tpInsc>${esc(empregador.tpInsc ?? "1")}</tpInsc>
        <nrInsc>${esc(empregador.cnpj)}</nrInsc>
      </ideEmpregador>
      <ideTrabalhador>
        <cpfTrab>${esc(r.cpf)}</cpfTrab>
        <nisTrab>${esc(r.nis ?? "")}</nisTrab>
      </ideTrabalhador>
      <dmDev>
        <codCateg>101</codCateg>
        <infoPerApur>
          <ideEstabLot>
            <tpInsc>1</tpInsc>
            <nrInsc>${esc(empregador.cnpj)}</nrInsc>
            <codLotacao>1</codLotacao>
            <detVerbas>
              <codRubr>5001</codRubr>
              <ideTabRubr>S</ideTabRubr>
              <qtdRubr>1</qtdRubr>
              <vrRubr>${centsToDecimal(r.salarioBrutoCents)}</vrRubr>
            </detVerbas>
            ${r.extraCents > 0 ? `
            <detVerbas>
              <codRubr>5002</codRubr>
              <ideTabRubr>S</ideTabRubr>
              <qtdRubr>1</qtdRubr>
              <vrRubr>${centsToDecimal(r.extraCents)}</vrRubr>
            </detVerbas>` : ""}
            ${r.noturnoCents > 0 ? `
            <detVerbas>
              <codRubr>5003</codRubr>
              <ideTabRubr>S</ideTabRubr>
              <qtdRubr>1</qtdRubr>
              <vrRubr>${centsToDecimal(r.noturnoCents)}</vrRubr>
            </detVerbas>` : ""}
          </ideEstabLot>
        </infoPerApur>
        <infoComplObrig>
          <codCateg>101</codCateg>
          <qtdDiasTrab>${esc(r.diasTrabalhados)}</qtdDiasTrab>
          <inss>
            <vlrInss>${centsToDecimal(r.inssCents)}</vlrInss>
          </inss>
          <irrf>
            <vlrIrrf>${centsToDecimal(r.irrfCents)}</vlrIrrf>
          </irrf>
        </infoComplObrig>
      </dmDev>
    </evtRemun>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v02_01_00" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <envioLoteEventos>
    <ideEmpregador>
      <tpInsc>${esc(empregador.tpInsc ?? "1")}</tpInsc>
      <nrInsc>${esc(empregador.cnpj)}</nrInsc>
    </ideEmpregador>
    <ideTransmissor>
      <nrCpfTrans>${esc(empregador.cpfResponsavel ?? "")}</nrCpfTrans>
    </ideTransmissor>
    <eventos>
      ${items}
    </eventos>
  </envioLoteEventos>
</eSocial>`;
}

function registerEsocialIpc(ipcMain, { dialog }) {
  ipcMain.handle("esocial:generateS1200", async (_evt, payload) => {
    if (!payload?.empregador?.cnpj) {
      throw new Error("CNPJ da empresa não configurado.");
    }
    if (!Array.isArray(payload?.remuneracoes) || payload.remuneracoes.length === 0) {
      throw new Error("Nenhum funcionário ativo com remuneração para exportar.");
    }

    let xml;
    try {
      xml = generateS1200Xml(payload);
    } catch (err) {
      throw new Error(`Erro ao gerar XML: ${err?.message ?? err}`);
    }

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `S1200-${payload.competencia}.xml`,
      filters: [{ name: "XML eSocial", extensions: ["xml"] }],
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    try {
      fs.writeFileSync(filePath, xml, "utf8");
      return { success: true, filePath };
    } catch (err) {
      throw new Error(`Falha ao salvar arquivo: ${err?.message ?? err}`);
    }
  });
}

module.exports = { registerEsocialIpc };
