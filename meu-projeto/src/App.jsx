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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarDadosDoExcelRemoto = async () => {
    try {
      // Usamos o construtor nativo de URL para isolar os parâmetros de quebra-cache
      const urlBaseOneDrive = "https://live.com";
      const parametros = new URLSearchParams();
      parametros.append("resid", "30b5823953aebd4c");
      parametros.append("download", "1");
      parametros.append("wdAllowInteractivity", "True");
      parametros.append("rand", String(Math.random()));

      const linkDiretoOneDrive = urlBaseOneDrive + "?" + parametros.toString();
      
      const response = await fetch(linkDiretoOneDrive);
      if (!response.ok) throw new Error("Falha ao se conectar diretamente com o OneDrive");
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const planilha = workbook.Sheets["Sheet1"];
      const dadosJson = XLSX.utils.sheet_to_json(planilha);

      if (dadosJson.length > 0) {
        const faturamentoPorProduto = {};
        const custoPorProduto = {};
        
        dadosJson.forEach((linha) => {
          const produto = String(linha["Product"] || "").trim();
          
          // Captura os valores de Vendas (Sales) e Custo (COGS) baseados nos cabeçalhos reais
          const vendaBruta = String(linha["Sales"] || "");
          const custoBruto = String(linha["COGS"] || "");
          
          // Limpa caracteres especiais de moedas ($ ou R$)
          const vendaLimpa = Number(vendaBruta.replace(/[^\d.-]/g, "")) || 0;
          const custoLimpo = Number(custoBruto.replace(/[^\d.-]/g, "")) || 0;

          if (produto && produto !== "undefined" && produto !== "") {
            faturamentoPorProduto[produto] = (faturamentoPorProduto[produto] || 0) + vendaLimpa;
            custoPorProduto[produto] = (custoPorProduto[produto] || 0) + custoLimpo;
          }
        });

        // 🧠 CÁLCULO DO ROI % CORPORATIVO
        const produtos = Object.keys(faturamentoPorProduto);
        const dadosROI = produtos.map((produto) => {
          const faturamentoTotal = faturamentoPorProduto[produto];
          const custoTotal = custoPorProduto[produto];
          
          if (custoTotal === 0) return 0;
          
          // Fórmula: ((Faturamento - Custo) / Custo) * 100
          const roi = ((faturamentoTotal - custoTotal) / custoTotal) * 100;
          return Number(roi.toFixed(2)); // Arredonda para 2 casas decimais
        });

        setChartData({
          labels: produtos,
          datasets: [
            {
              label: "Retorno sobre Investimento (ROI)",
              data: dadosROI,
              backgroundColor: "rgba(75, 192, 192, 0.6)", // Verde corporativo elegante para ROI
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro no processamento do ROI remoto:", error);
      usarDadosSimuladosLocais();
    }
  };

  const usarDadosSimuladosLocais = () => {
    // Dados mockados de ROI % simulados caso a conexão caia
    const dadosMock = {
      labels: ["Carretera", "Montana", "Paseo", "Velo", "VTT"],
      datasets: [{
        label: "Retorno sobre Investimento (ROI)",
        data: [15.4, 24.8, 12.1, 31.5, 18.9],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      }]
    };
    setChartData(dadosMock);
    setLoading(false);
  };

  useEffect(() => {
    carregarDadosDoExcelRemoto();
    const intervalo = setInterval(carregarDadosDoExcelRemoto, 15000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#121214", color: "#fff", minHeight: "100vh" }}>
      
      {/* Cabeçalho Avançado */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ fontSize: "40px", backgroundColor: "#202024", padding: "10px", borderRadius: "12px" }}>📈</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Dashboard Performance Executiva</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            Análise de ROI % em tempo real integrado à planilha remota do OneDrive.
          </p>
        </div>
      </div>
      
      {/* Container do Gráfico */}
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
        {loading || !chartData ? (
          <p style={{ color: "#333", textAlign: "center", fontWeight: "bold" }}>Calculando indicadores de ROI na nuvem...</p>
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
                    text: "Rentabilidade Real (ROI %) por Linha de Produto", 
                    color: "#333", 
                    font: { size: 16, weight: "bold" } 
                  },
                  tooltip: {
                    callbacks: {
                      // 🛠️ Adiciona o símbolo de % no balão de informação ao passar o mouse
                      label: (context) => ` ROI: ${context.parsed.y}%`
                    }
                  }
                },
                scales: {
                  x: { ticks: { color: "#333", font: { weight: "bold" } }, grid: { display: false } },
                  y: { 
                    ticks: { 
                      color: "#333",
                      // 🛠️ Adiciona o símbolo de % no eixo vertical do gráfico
                      callback: (value) => `${value}%`
                    }, 
                    grid: { color: "rgba(0, 0, 0, 0.05)" } 
                  },
                },
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
