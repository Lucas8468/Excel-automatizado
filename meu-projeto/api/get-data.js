import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  // Ativa os cabeçalhos de liberação total para o navegador não chiar
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // O link de download direto do seu Financial Sample no OneDrive Web
  const EXCEL_URL = "https://live.com";

  try {
    // 🔥 O ATAQUE MÁXIMO: Fazemos o servidor da Vercel baixar como arraybuffer
    const response = await axios.get(`${EXCEL_URL}&t=${new Date().getTime()}`, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" } // Passa um disfarce de navegador para o OneDrive não barrar
    });
    
    // Lê os dados binários puros vindos da nuvem da Microsoft
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const planilha = workbook.Sheets["Sheet1"];
    
    // Converte a aba do Excel Web em uma matriz limpa
    const dadosMatriz = XLSX.utils.sheet_to_json(planilha, { header: 1 });
    
    // Devolve com status 200 (Sucesso Absoluto) para o React!
    return res.status(200).json(dadosMatriz);
  } catch (error) {
    console.error("ERRO NO BACKEND:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
