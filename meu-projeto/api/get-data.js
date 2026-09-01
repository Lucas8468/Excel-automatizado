import * as XLSX from "xlsx";

export default async function handler(req, res) {
  // Configura os cabeçalhos de resposta para evitar travas locais no navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Link de download direto do seu arquivo Financial Sample no OneDrive
  const EXCEL_ONEDRIVE_URL = "https://live.com";

  try {
    // Faz o download do arquivo direto pelo servidor da Vercel (Burla o CORS de vez)
    const response = await fetch(`${EXCEL_ONEDRIVE_URL}&t=${new Date().getTime()}`);
    
    if (!response.ok) throw new Error("Falha ao baixar arquivo do OneDrive");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Lê as informações binárias do Excel
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const planilha = workbook.Sheets["Sheet1"];
    
    // Converte para matriz pura [[Linha1], [Linha2]]
    const dadosMatriz = XLSX.utils.sheet_to_json(planilha, { header: 1 });
    
    // Retorna a matriz para o React consumir de forma limpa
    return res.status(200).json(dadosMatriz);
  } catch (error) {
    console.error("Erro no processamento do Back-end:", error);
    return res.status(500).json({ error: error.message });
  }
}
