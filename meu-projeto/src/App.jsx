import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registra os componentes necessários do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Link de download direto e público do seu Financial Sample no OneDrive
  const EXCEL_ONEDRIVE_URL = "https://live.com";

  const carregarDadosDoExcelRemoto = async () => {
    try {
      // O caractere extra adicionado deve ser '&' e não '?' para não quebrar a URL base
      const response = await fetch(`${EXCEL_ONEDRIVE_URL}&t=${new Date().getTime()}`);
      
      if (!response.ok) throw new Error("Erro ao baixar o arquivo do OneDrive");
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Lê o arquivo do Excel diretamente no navegador do usuário
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const planilha = workbook.Sheets["Sheet1"]; // Abre a aba Sheet1
      
      // Converte as linhas em uma matriz pura [[Linha 1], [Linha 2]]
      const dadosMatriz = XLSX.utils.sheet_to_json(planilha, { header: 1 });

      if (dadosMatriz.length > 1) {
        const agrupado = {};
        
        // Mapeia as colunas do Financial Sample (Índice 1 = Categoria/Produto, Índice 4 = Vendas)
        for (let i = 1; i < dadosMatriz.length; i++) {
          const linha = dadosMatriz[i];
          if (!linha || linha.length === 0) continue;

          // Se a sua planilha tiver o produto na coluna B use linha[1], se for na coluna C use linha[2]
          const produto = String(linha[1] || linha[2] || "").trim();
          const valorBruto = String(linha[4] || linha[5] || "");
          
          // Limpa caracteres especiais de moedas (como $) para não quebrar a soma matemática
          const valorLimpo = valorBruto.replace(/[^\d.-]/g, ""); 
          const valorY = Number(valorLimpo) || 0;

          if (produto && produto !== "undefined" && produto !== "") {
            agrupado[produto] = (agrupado[produto] || 0) + valorY;
          }
        }

        // Atualiza a estrutura oficial de dados do Chart.js
        setChartData({
          labels: Object.keys(agrupado),
          datasets: [
            {
              label: "Volume Financeiro",
              data: Object.values(agrupado),
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao processar planilha no front-end:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosDoExcelRemoto();
    // Polling Remoto: Puxa atualizações do OneDrive a cada 30 segundos automaticamente
    const intervalo = setInterval(carregarDadosDoExcelRemoto, 30000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#121214", color: "#fff", minHeight: "100vh" }}>
      
      {/* Cabeçalho do Dashboard */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ fontSize: "40px", backgroundColor: "#202024", padding: "10px", borderRadius: "12px" }}>🏢</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Dashboard 100% Remoto (OneDrive)</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            Sincronizado diretamente com o Excel Web. Atualizações automáticas sem scripts locais.
          </p>
        </div>
      </div>
      
      {/* Container do Gráfico de Barras */}
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
        {loading || !chartData ? (
          <p style={{ color: "#333", textAlign: "center", fontWeight: "bold" }}>Conectando à nuvem do OneDrive e processando dados...</p>
        ) : (
          <div style={{ width: "100%", height: "400px" }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { 
                    display: true, 
                    text: "Vendas Consolidadas por Produto (Nuvem Direta)", 
                    color: "#333", 
                    font: { size: 16, weight: "bold" },
                    padding: { bottom: 20 }
                  },
                },
                scales: {
                  x: { ticks: { color: "#333", font: { weight: "bold" } }, grid: { display: false } },
                  y: { ticks: { color: "#333" }, grid: { color: "rgba(0, 0, 0, 0.05)" } },
                },
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
