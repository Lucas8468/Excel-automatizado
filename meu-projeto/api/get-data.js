import https from "https";
import * as XLSX from "xlsx";

export default function handler(req, res) {
  // Liberação total de CORS nas linhas de frente
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const EXCEL_URL = "https://live.com";

  // Usamos o módulo HTTPS nativo em formato de stream para burlar o estouro de memória
  https.get(`${EXCEL_URL}&t=${new Date().getTime()}`, (response) => {
    const chunks = [];

    response.on("data", (chunk) => {
      chunks.push(chunk);
    });

    response.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks);
        // Lemos os dados estruturados em formato binário limpo
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const planilha = workbook.Sheets["Sheet1"];
        const dadosMatriz = XLSX.utils.sheet_to_json(planilha, { header: 1 });
        
        return res.status(200).json(dadosMatriz);
      } catch (err) {
        return res.status(500).json({ error: "Falha na decodificação: " + err.message });
      }
    });
  }).on("error", (err) => {
    return res.status(500).json({ error: "Erro de conexão: " + err.message });
  });
}
