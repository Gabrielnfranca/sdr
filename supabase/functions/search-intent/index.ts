
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, days = 30 } = await req.json();
    const authHeader = req.headers.get("Authorization");

     // --- AUTH CHECK ---
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader ?? "" } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        console.error("Auth Error:", userError);
        // Retornando 200 em vez de 401 para o frontend tratar a mensagem elegantemente
        return new Response(JSON.stringify({ success: false, error: "Usuário não autenticado. Tente fazer login novamente." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
        });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY"); // Usando a mesma chave
    const cx = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    if (!apiKey || !cx) {
         throw new Error("Configuração de API incompleta (Falta API Key ou CX)");
    }

    // Estratégia de Busca (Dorks)
    const networks = [
        'site:linkedin.com/posts',
        'site:instagram.com',
        'site:facebook.com',
        'site:twitter.com'
    ].join(' OR ');

    const fullQuery = `${query} (${networks})`;
    const dateRestrict = `d${days}`; // d[dias]

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(fullQuery)}&dateRestrict=${dateRestrict}&num=10`;

    console.log(`Buscando Intenção: ${fullQuery} (Últimos ${days} dias)`);

    const res = await fetch(searchUrl);
    const data = await res.json();

    if (data.error) {
        // Fallback Mock se der erro (ex: 403 Billing)
        console.warn("Erro Google API (Intent):", data.error);
        
        return new Response(JSON.stringify({ 
            success: true, 
            isMock: true,
            leads: [
                {
                    company_name: "Post no LinkedIn (Simulado)",
                    segment: "Indicação",
                    notes: `Encontrado buscando por: "${query}". (API Bloqueada - Modo Simulação)`,
                    source: "linkedin",
                    status: "lead_novo",
                    website: "https://linkedin.com",
                    created_at: new Date().toISOString()
                },
                {
                    company_name: "Comentário no Instagram (Simulado)",
                    segment: "Procura-se",
                    notes: `Encontrado buscando por: "${query}". (API Bloqueada - Modo Simulação)`,
                    source: "instagram",
                    status: "lead_novo",
                    website: "https://instagram.com",
                    created_at: new Date().toISOString()
                }
            ]
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const leads = (data.items || []).map((item: any) => ({
        company_name: item.title || "Lead de Rede Social",
        segment: "Interesse Detectado",
        city: "Internet", // Difícil saber a cidade exata por post
        website: item.link,
        source: item.link.includes("linkedin") ? "linkedin" : 
                item.link.includes("instagram") ? "instagram" : 
                item.link.includes("facebook") ? "facebook" : "google_search",
        status: "lead_novo",
        notes: `[INTENÇÃO] Snippet: ${item.snippet}\nLink: ${item.link}`,
        tenant_id: user.id
    }));

    // Inserir no Banco
    if (leads.length > 0) {
        const { error: insertError } = await supabaseClient
            .from("leads")
            .insert(leads);
        
        if (insertError) console.error("Erro ao salvar leads:", insertError);
    }

    return new Response(JSON.stringify({ success: true, count: leads.length, leads }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
