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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarDadosDoBackEnd = async () => {
    try {
      // Chama a rota de API interna que criamos
      const response = await fetch("/api/get-data");
      const dadosMatriz = await response.json();

      if (dadosMatriz && dadosMatriz.length > 1) {
        const agrupado = {};
        
        // Percorre as linhas do Financial Sample vindo do OneDrive Web (Índice 2 = Produto, Índice 4 = Vendas)
        for (let i = 1; i < dadosMatriz.length; i++) {
          const linha = dadosMatriz[i];
          if (!linha || linha.length === 0) continue;

          const produto = String(linha[2] || "").trim();
          const valorBruto = String(linha[4] || "");
          const valorLimpo = valorBruto.replace(/[^\d.-]/g, ""); 
          const valorY = Number(valorLimpo) || 0;

          if (produto && produto !== "undefined" && produto !== "") {
            agrupado[produto] = (agrupado[produto] || 0) + valorY;
          }
        }

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
      console.error("Erro ao consumir API de dados:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosDoBackEnd();
    // Polling Remoto: Verifica atualizações no Excel Web a cada 15 segundos!
    const intervalo = setInterval(carregarDadosDoBackEnd, 15000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#121214", color: "#fff", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ fontSize: "40px", backgroundColor: "#202024", padding: "10px", borderRadius: "12px" }}>🏢</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Dashboard Excel Web Real-Time</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            Sincronização corporativa direta com o Microsoft OneDrive.
          </p>
        </div>
      </div>
      
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
        {loading || !chartData ? (
          <p style={{ color: "#333", textAlign: "center", fontWeight: "bold" }}>Buscando alterações no Excel Remoto...</p>
        ) : (
          <div style={{ width: "100%", height: "400px" }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: "Vendas Consolidadas por Produto (Excel Nuvem)", color: "#333", font: { size: 16, weight: "bold" } },
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
