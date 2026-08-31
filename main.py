import time
import os
import pandas as pd
import psycopg2
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 1. Cole aqui a sua String de Conexão do Neon
NEON_CONN_STRING = "SUA_CONNECTION_STRING_DO_NEON_AQUI"

# 2. Defina o caminho do seu arquivo local Financial Sample
# Mude para o caminho correto do seu arquivo no computador
EXCEL_PATH = r"C:\Users\lucas\OneDrive\Documentos\Financial Sample.xlsx"
PASTA_DO_EXCEL = r"C:\Users\lucas\OneDrive\Documentos"


class ExcelToNeonHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path == EXCEL_PATH:
            print("🔄 Alteração salva no Excel! Atualizando o banco Neon de nível empresarial...")
            time.sleep(1) # Aguarda o Excel terminar de escrever o arquivo no disco
            
            try:
                # Lê a planilha Sheet1
                df = pd.read_excel(EXCEL_PATH, sheet_name="Sheet1")
                
                # Mapeia dinamicamente pelas POSIÇÕES das colunas (Ex: Coluna 1 e Coluna 4)
                # No Financial Sample, a coluna 1 costuma ser 'Country' ou 'Product' e a 4 'Units Sold' ou 'Sales'
                coluna_texto = df.iloc[:, 1]  # Segunda coluna (Eixo X)
                coluna_numerica = df.iloc[:, 4] # Quinta coluna (Eixo Y)
                
                conn = psycopg2.connect(NEON_CONN_STRING)
                cursor = conn.cursor()
                
                # Limpa registros anteriores (Truncate)
                cursor.execute("TRUNCATE TABLE dashboard_data;")
                
                # Insere linha por linha tratando valores monetários corrompidos
                for i in range(len(df)):
                    label_x = str(coluna_texto.iloc[i]).trim()
                    
                    # Limpa símbolos de moeda ($ ou R$) caso existam no Excel
                    valor_cru = str(coluna_numerica.iloc[i])
                    valor_limpo = ''.join(c for c in valor_cru if c.isdigit() or c in ['.', '-'])
                    val_y = float(valor_limpo) if valor_limpo else 0.0
                    
                    if label_x and label_x != "nan":
                        cursor.execute(
                            "INSERT INTO dashboard_data (eixo_x, eixo_y) VALUES (%s, %s)",
                            (label_x, val_y)
                        )
                
                conn.commit()
                cursor.close()
                conn.close()
                print("🚀 Banco de dados atualizado com sucesso na nuvem!")
                
            except Exception as e:
                print(f"❌ Erro ao ler ou enviar dados: {e}")

if __name__ == "__main__":
    event_handler = ExcelToNeonHandler()
    observer = Observer()
    observer.schedule(event_handler, path=PASTA_DO_EXCEL, recursive=False)
    observer.start()
    print("👀 [SERVER PROX] Script ativo e monitorando a planilha corporativa...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
