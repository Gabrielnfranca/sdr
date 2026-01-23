

// Setup for Supabase Edge Runtime
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting Search Intent Function...");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
         throw new Error("Missing Authorization Header");
    }

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Auth Check
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
         console.error("Auth Failed:", authError);
         return new Response(JSON.stringify({ success: false, error: "Authentication failed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 // Soft error
        });
    }

    // Body Parsing
    let body = {};
    try {
        body = await req.json();
    } catch { 
        // Ignore JSON errors (maybe body is empty)
    }
    const { query, days } = body;

    // Configuration Check
    const serpApiKey = Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) {
        console.error("Missing SERPAPI_KEY");
        return new Response(JSON.stringify({ 
            success: false, 
            error: "Erro de Configuração: SERPAPI_KEY não encontrada. Configure a chave no Supabase Secrets." 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 // Return 200 so the UI can parse the error message
        });
    }

    // If no query, return empty or error
    if (!query) {
         return new Response(JSON.stringify({ success: false, error: "Query parameter missing" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // --- LOGICA DE INTENÇÃO DE COMPRA (O Diferencial) ---
    // Transforma a busca simples em uma busca por "Sinais de Compra"
    // Ex: Se o usuario busca "dentista", procuramos: "indicação de dentista", "preciso de dentista"
    
    // 1. Definição de Termos de Intenção (Buying Signals)
    const intentPhrases = '"preciso de" OR "indicação de" OR "procuro" OR "busco" OR "alguém recomenda" OR "orçamento para" OR "gostaria de contratar"';
    
    // 2. Redes Sociais e Foruns (Onde as pessoas reais falam)
    const networks = "(site:linkedin.com/posts OR site:instagram.com OR site:facebook.com OR site:twitter.com OR site:reddit.com)";

    // 3. Montagem da Query Boleana Avançada
    // Formato: (nicho) AND (termos de intenção) site:redes
    const fullQuery = `(${query}) AND (${intentPhrases}) ${networks}`;

    // 4. Filtro de Recência (Real-Time)
    // Converte dias escolhidos em parametro do Google (tbs)
    let timeFilter = "qdr:m"; // Default: Ultimo mês
    if (days && days <= 1) timeFilter = "qdr:d"; // Ultimas 24h
    else if (days && days <= 7) timeFilter = "qdr:w"; // Ultima semana
    else if (days && days <= 365) timeFilter = "qdr:y"; // Ultimo ano

    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(fullQuery)}&api_key=${serpApiKey}&num=20&google_domain=google.com.br&gl=br&hl=pt&tbs=${timeFilter}`;
    
    console.log(`Searching Intent: "${fullQuery}" (Time: ${timeFilter})`);
    
    console.log("Fetching from SerpApi...");
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text();
        console.error("SerpApi fail:", txt);
        throw new Error(`External API Error: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: `SerpApi Error: ${data.error}` 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        });
    }

    // Map Result
    const organic = data.organic_results || data.organic_results_state || [];
    const leads = organic.map((item: any) => {
        // Tenta limpar o título para achar um nome
        let title = item.title || "Social Lead";
        
        // Remove sufixos comuns de redes sociais do título
        title = title.replace(" | LinkedIn", "").replace(" | Facebook", "").replace(" - Instagram", "").trim();

        return {
            tenant_id: user.id,
            company_name: title.substring(0, 100),
            status: "lead_novo",
            source: "social_intencao", // Diferencia da busca normal
            notes: `⚠️ SINAL DE COMPRA DETECTADO\n\nContexto: "${item.snippet}"\n\nLink Original: ${item.link}`,
            website: item.link,
            tags: ["intenção_compra", "social_listening", query] // Tags auto-explicativas
        };
    });

    // Save
    if (leads.length > 0) {
        const { error } = await supabaseClient.from("leads").insert(leads);
        if (error) {
             console.error("DB Insert Error:", error);
             throw new Error("Failed to save leads to database");
        }
    }

    return new Response(JSON.stringify({ success: true, count: leads.length, leads }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Global Catch:", err);
    return new Response(JSON.stringify({ 
        success: false, 
        error: err.message || "Unknown Error",
        details: err.toString()
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Always return 200 to prevent frontend generic error
    });
  }
});

