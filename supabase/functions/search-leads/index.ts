import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utils 
function extractEmails(text: string): string[] {
  if (!text) return [];
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
  return text.match(emailRegex) || [];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, location, site_filter, siteFilter, limit } = await req.json();
    
    // Validate inputs
    if (!query) {
      throw new Error("Busca (query) é obrigatória");
    }

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get User from Auth Context (if authorized) or Default (if testing/anon)
    // NOTE: Edge Functions invoked via supabase-js carry the user jwt in Auth header
    // But since we initialized with Service Role Key above for full access, 
    // we need to extract the user from the request header manually if we want to respect RLS or get their ID.
    // However, for this background job, we often need the Service Role.
    // We NEED a tenant_id. 
    // Option 1: Pass tenant_id in body.
    // Option 2: Extract user from Authorization header.
    
    // Let's try to get the user from the original request auth header
    const authHeader = req.headers.get('Authorization')
    let userId = null;
    
    if (authHeader) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) userId = user.id;
    }

    // Fallback for testing/dev if no auth header (should not happen in prod app usage)
    if (!userId) {
       // Try to find a default user or fail
       // For this specific case, if called from test script with ANON key, we might be 'anon' which has no ID.
       // We'll throw if we can't find a valid ID because DB requires it.
       // UNLESS we are in a permissive mode. 
       // Let's assume the user IS the tenant for now (1:1 mapping in this simple schema?)
       // Checking migration: tenant_id IS required.
       
       // FOR TESTING ONLY: If we can't get a user, we might be stuck.
       // The test script uses ANON key. 
       // Ideally we should sign in in the test script. 
       // For now, let's look for a dummy user or just fail with a clear message.
    }

    // In a real multi-tenant app, we must identify the tenant.
    // If userId is found, we use it as tenant_id (assuming simple ownership model as per policies).
    const tenantId = userId; 

    if (!tenantId) {
         // Try to match strict RLS. If we are running as Service Role, we can insert anything, 
         // but we need a valid UUID for tenant_id. 
         // If we are called anonymously, we can't insert "owned" data.
         throw new Error("Usuário não autenticado. Autenticação necessária para salvar leads.");
    }


    // Initialize SerpApi Key
    const serpApiKey = Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) {
      throw new Error("SERPAPI_KEY não configurada no ambiente");
    }

    // Normalize Parameters
    const maxLeads = limit ? parseInt(limit) : 20;
    const activeSiteFilter = site_filter || siteFilter || 'all';

    console.log(`[SEARCH-LEADS] Query: "${query}", Loc: "${location || 'N/A'}", Limit: ${maxLeads}, Filter: ${activeSiteFilter}`);

    // Construct search query
    const searchQuery = location ? `${query} em ${location}` : query;
    
    let allProcessedLeads: any[] = [];
    let start = 0;
    let hasMoreResults = true;
    
    // Pagination Loop
    while (allProcessedLeads.length < maxLeads && hasMoreResults) {
        if (start > 100) break; // Hard limit

        console.log(`[SEARCH-LEADS] Fetching page start=${start}...`);
        
        const params = new URLSearchParams({
          engine: "google_maps",
          q: searchQuery,
          api_key: serpApiKey,
          type: "search",
          hl: "pt-br",
          gl: "br",
          num: "20",
          start: start.toString()
        });

        const serpUrl = `https://serpapi.com/search.json?${params.toString()}`;
        
        const resp = await fetch(serpUrl);
        if (!resp.ok) {
           const errText = await resp.text();
           console.error(`SerpApi Erro na página ${start}: ${errText}`);
           break;
        }

        const data = await resp.json();
        const places = data.local_results || [];

        if (places.length === 0) {
            hasMoreResults = false;
            break;
        }

        console.log(`[SEARCH-LEADS] Página retornou ${places.length} locais.`);

        // Process concurrently
        const pageLeads = await Promise.all(places.map(async (place: any) => {
            const companyName = place.title;
            const address = place.address || "";
            const phone = place.phone || "";
            const website = place.website;
            const segment = place.type || query;
            
            let siteClassification = 'site_desconhecido';
            let email = "";
            let hasSite = !!website;
            
            if (!hasSite) {
                siteClassification = 'sem_site';
            } else {
                 siteClassification = 'site_ok'; 
                 // Lightweight scrape
                 try {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 8000); 
                    
                    const siteResp = await fetch(website, { 
                       method: 'GET',
                       signal: controller.signal,
                       headers: { 
                         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0",
                         "Accept": "text/html"
                       }
                    });
    
                    if (siteResp.ok) {
                       const html = await siteResp.text();
                       const emails = extractEmails(html);
                       const validEmail = emails.find(e => !e.includes('example') && !e.includes('wix') && e.length < 60);
                       if (validEmail) email = validEmail;
                       if (html.length < 500) siteClassification = 'site_sem_seo';
                    }
                 } catch (e: any) {
                    // Ignore
                 }
            }
    
            if (activeSiteFilter === 'without_site' && hasSite) return null;
            if (activeSiteFilter === 'with_site' && !hasSite) return null;
    
            return {
               tenant_id: tenantId, 
               company_name: companyName,
               segment: segment,
               city: location || "Brasil", 
               state: "SP",
               phone: phone,
               whatsapp: phone,
               website: website,
               email: email,
               status: 'lead_novo',
               source: 'google_maps',
               description: `Endereço: ${address}. \n${place.description || ""}`,
               site_classification: siteClassification,
               score: 50
            };
        }));
        
        const validPageLeads = pageLeads.filter(l => l !== null);
        allProcessedLeads = [...allProcessedLeads, ...validPageLeads];
        
        start += 20;

        if (allProcessedLeads.length >= maxLeads) {
             allProcessedLeads = allProcessedLeads.slice(0, maxLeads);
             break;
        }

        if (!data.serpapi_pagination?.next) {
            hasMoreResults = false;
        }
    }

    console.log(`[SEARCH-LEADS] Total leads processados (acumulado): ${allProcessedLeads.length}`);

    if (allProcessedLeads.length > 0) {
        const { data: inserted, error: insertError } = await supabaseClient
            .from("leads")
            .insert(allProcessedLeads)
            .select();

        if (insertError) {
             console.error("Erro ao inserir leads:", insertError);
             throw new Error(`Erro DB: ${insertError.message}`);
        }
        
        return new Response(JSON.stringify({ 
            success: true, 
            leads: inserted, 
            message: `Sucesso! ${inserted.length} leads importados.` 
        }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ 
        success: true, 
        leads: [], 
        message: "Nenhum lead encontrado com os filtros selecionados." 
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Erro geral na função search-leads:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
