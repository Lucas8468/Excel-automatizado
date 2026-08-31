import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configura os cabeçalhos de CORS para permitir que o React local (localhost:5173) acesse a API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // A Vercel lerá a Connection String automaticamente das variáveis de ambiente em produção.
    // Para testar localmente no desenvolvimento, você pode colocar sua string do Neon direto aqui se quiser,
    // mas o padrão de mercado é usar variáveis de ambiente (process.env.DATABASE_URL).
    const databaseUrl = process.env.DATABASE_URL || "SUA_CONNECTION_STRING_DO_NEON_AQUI";
    
    const sql = neon(databaseUrl);
    
    // Executa a query SQL no banco Neon buscando os dados inseridos pelo script Python
    const response = await sql`SELECT eixo_x, eixo_y FROM dashboard_data ORDER BY id ASC`;
    
    // Retorna os dados para o gráfico em formato JSON com status 200 (Sucesso)
    return res.status(200).json(response);
  } catch (error) {
    console.error("Erro na API Serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}
