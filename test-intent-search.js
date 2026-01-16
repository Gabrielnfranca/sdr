
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuração
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
// SE VOCÊ JÁ TIVER UM CX, COLOQUE AQUI OU NO .ENV COMO GOOGLE_SEARCH_ENGINE_ID
const CX = process.env.GOOGLE_SEARCH_ENGINE_ID; 

const SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║             AUTOMAÇÃO DE BUSCA POR INTENÇÃO (SDR 2.0)              ║
╠════════════════════════════════════════════════════════════════════╣
║ Este script busca leads que demonstraram interesse em serviços     ║
║ (ex: "preciso de site") dentro de redes sociais (LinkedIn/Insta).  ║
╚════════════════════════════════════════════════════════════════════╝
`);

async function searchIntent(term, days) {
  if (!API_KEY) {
    console.error("❌ ERRO: Nenhuma API KEY encontrada no arquivo .env");
    return;
  }
  
  if (!CX) {
    console.error("⚠️  AVISO: Faltando 'GOOGLE_SEARCH_ENGINE_ID' (CX).");
    console.log("   Para funcionar, você precisa criar um motor de busca personalizado:");
    console.log("   1. Acesse: https://programmablesearchengine.google.com/controlpanel/create");
    console.log("   2. Nome: 'Busca Geral'");
    console.log("   3. O que pesquisar: Selecione 'Pesquisar em toda a Web' (IMPORTANTE!)");
    console.log("   4. Copie o 'ID do mecanismo de pesquisa' (CX) e adicione no .env");
    console.log("\n   Tentando rodar mesmo assim (vai falhar se o CX for obrigatório)...");
  }

  // Google Dorks - A mágica acontece aqui
  const networks = [
    'site:linkedin.com/posts',
    'site:instagram.com',
    'site:facebook.com',
    'site:twitter.com'
  ].join(' OR ');

  const query = `${term} (${networks})`;
  
  // Parâmetro de data: d[number], w[number], m[number]
  const dateRestrict = `d${days}`; // Últimos X dias

  const params = new URLSearchParams({
    key: API_KEY,
    cx: CX || '', 
    q: query,
    dateRestrict: dateRestrict,
    num: 10 // Max resultados por pag
  });

  console.log(`\n🔍 Buscando: "${term}" nos últimos ${days} dias...`);
  console.log(`🔗 Query: ${query}`);

  try {
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
    const data = await res.json();

    if (data.error) {
      console.error(`\n❌ Erro da API Google: [${data.error.code}] ${data.error.message}`);
      if (data.error.code === 400 && data.error.message.includes("cx")) {
        console.log("👉 DICA: O erro acima confirma que precisamos do 'SEARCH ENGINE ID' (CX).");
      }
      return;
    }

    if (!data.items || data.items.length === 0) {
      console.log("\n⚠️  Nenhum resultado encontrado. Tente aumentar o prazo ou mudar o termo.");
      return;
    }

    console.log(`\n✅ Sucesso! Encontramos ${data.items.length} oportunidades:\n`);

    data.items.forEach((item, index) => {
      console.log(`[${index + 1}] ${item.title}`);
      console.log(`    🔗 ${item.link}`);
      console.log(`    👀 "${item.snippet?.replace(/\n/g, ' ')}"`);
      console.log('---------------------------------------------------');
    });

  } catch (error) {
    console.error("Erro na execução:", error);
  }
}

// Perguntas Interativas ou Argumentos de Linha de Comando
const args = process.argv.slice(2);

if (args.length > 0) {
  // Modo não-interativo (Argumentos)
  const term = args[0];
  const days = args[1] || 30;
  searchIntent(term, days).then(() => process.exit(0));
} else {
  // Modo interativo
  rl.question('O que você procura? (ex: "preciso de um site", "indicação gestão tráfego"): ', (term) => {
    const searchTerm = term || "preciso de um site";
    
    rl.question('Buscar nos últimos quantos dias? (ex: 30): ', (days) => {
      const searchDays = days || 30;
      searchIntent(searchTerm, searchDays).then(() => rl.close());
    });
  });
}
