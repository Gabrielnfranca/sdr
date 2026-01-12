
const url = "http://localhost:5678/webhook-test/search";

async function testN8N() {
  console.log("Enviando dados de teste para o n8n...");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leads: [
          {
            company_name: "Empresa Teste Ltda",
            website: "https://teste.com.br",
            email: "contato@teste.com.br",
            city: "São Paulo",
            status: "lead_novo"
          }
        ],
        query: "Teste de Integração Manual",
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Resposta: ${text}`);
  } catch (error) {
    console.error("Erro:", error);
  }
}

testN8N();
