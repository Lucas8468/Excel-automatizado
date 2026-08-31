import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// 1. Registra os componentes obrigatórios do Chart.js para evitar quebras de renderização
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Função de busca conectada à API Serverless da Vercel
  const buscarDadosDaApiNeon = async () => {
    try {
      const response = await fetch("/api/get-data");
      
      if (response.ok) {
        const dadosDoBanco = await response.json();
        if (dadosDoBanco && dadosDoBanco.length > 0) {
          processarDadosParaOGrafico(dadosDoBanco);
          return;
        }
      }
      // Se a API não responder (ambiente local do Vite), aciona os dados simulados
      usarDadosSimuladosLocais();
    } catch (error) {
      console.warn("API Serverless local indisponível. Carregando dados de simulação...");
      usarDadosSimuladosLocais();
    }
  };

  // 3. Processa e consolida as linhas duplicadas do Excel para o formato do Chart.js
  const processarDadosParaOGrafico = (dados) => {
    const agrupado = {};

    dados.forEach((row) => {
      // Aceita chaves do Neon (eixo_x/y) ou chaves diretas do Financial Sample
      const x = row.eixo_x || row.Product || row.label || "Item";
      const y = Number(row.eixo_y || row.Sales || row.value) || 0;
      agrupado[x] = (agrupado[x] || 0) + y;
    });

    const labels = Object.keys(agrupado);
    const valores = Object.values(agrupado);

    setChartData({
      labels: labels,
      datasets: [
        {
          label: "Volume Financeiro",
          data: valores,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    });
    setLoading(false);
  };

  // 4. Dados simulados para o ambiente de desenvolvimento
  const usarDadosSimuladosLocais = () => {
    const dadosMock = [
      { eixo_x: "Carretera", eixo_y: 125400 },
      { eixo_x: "Montana", eixo_y: 95400 },
      { eixo_x: "Paseo", eixo_y: 210000 },
      { eixo_x: "Velo", eixo_y: 84300 },
      { eixo_x: "VTT", eixo_y: 153000 },
    ];
    processarDadosParaOGrafico(dadosMock);
  };

  // 5. Ciclo de vida e pooling (atualização programada a cada 10 segundos)
  useEffect(() => {
    buscarDadosDaApiNeon();
    const intervalo = setInterval(buscarDadosDaApiNeon, 10000);
    return () => clearInterval(intervalo);
  }, []);

  // 6. Estrutura de visualização com layout corrigido via Flexbox
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#121214", color: "#fff", minHeight: "100vh" }}>
      
      {/* Cabeçalho alinhado que evita sobreposição de elementos */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ fontSize: "40px", backgroundColor: "#202024", padding: "10px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}>
          🏢
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Dashboard Corporativo Integrado</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            Ambiente corporativo de desenvolvimento local. Sincronizado com modelo do Excel.
          </p>
        </div>
      </div>
      
      {/* Box do Gráfico empurrado para baixo com espaçamentos controlados */}
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>
        {loading || !chartData ? (
          <p style={{ color: "#333", textAlign: "center", fontWeight: "bold" }}>Carregando componentes gráficos corporativos...</p>
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
                    text: "Vendas Consolidadas por Produto (Produção)", 
                    color: "#121214", 
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
        <p style={{ textAlign: "center", marginTop: "20px", color: "#ccc", fontSize: "14px" }}>
          Feito por: Lucas Brandão da Silva
        </p>
    </div>
  );
}
