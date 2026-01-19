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
    const { query, location, site_filter } = await req.json();
    
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

    console.log(`[SEARCH-LEADS] Iniciando busca via SerpApi: "${query}" em "${location || 'Brasil'}"`);

    // 1. Search Google Maps via SerpApi
    // Construct search query: e.g. "advocacia em São Paulo, SP"
    const searchQuery = location ? `${query} em ${location}` : query;
    
    const params = new URLSearchParams({
      engine: "google_maps",
      q: searchQuery,
      api_key: serpApiKey,
      type: "search", // search for places
      hl: "pt-br", // Portuguese
      gl: "br", // Country Brazil
      num: "20" // Max results per page
    });

    const serpUrl = `https://serpapi.com/search.json?${params.toString()}`;
    console.log(`[SEARCH-LEADS] Fetching: ${serpUrl}`);

    const resp = await fetch(serpUrl);
    if (!resp.ok) {
       const errText = await resp.text();
       throw new Error(`SerpApi Erro: ${resp.status} - ${errText}`);
    }

    const data = await resp.json();
    const places = data.local_results || [];

    console.log(`[SEARCH-LEADS] Encontrados ${places.length} locais brutos.`);

    if (places.length === 0) {
       return new Response(JSON.stringify({ success: true, leads: [], message: "Nenhum local encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Process Results concurrently
    const processedLeads = await Promise.all(places.map(async (place: any) => {
        // Basic Info
        const companyName = place.title;
        const address = place.address || "";
        const phone = place.phone || "";
        const website = place.website;
        const segment = place.type || query; // Fallback to query if type is missing
        
        let siteClassification = 'site_desconhecido';
        let email = "";
        let hasSite = !!website;
        
        // Determine initial classification
        if (!hasSite) {
            siteClassification = 'sem_site';
        } else {
            // If we have a site, we can try to scrape it quickly for email or seo status
             siteClassification = 'site_ok'; // Default assumption
             
             // Lightweight scrape attempt (timeout 8s)
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
                   // Basic email extraction
                   const emails = extractEmails(html);
                   // Filter junk emails
                   const validEmail = emails.find(e => !e.includes('example') && !e.includes('wix') && e.length < 60);
                   if (validEmail) email = validEmail;

                   // Basic SEO check
                   if (html.length < 500) siteClassification = 'site_sem_seo';
                }
             } catch (e: any) {
                // If it fails, maybe site is dead
                console.log(`[Lead] Falha ao acessar site ${website}: ${e.message}`);
                // siteClassification = 'site_fraco'; 
             }
        }

        // Apply Logic Filters
        if (site_filter === 'without_site' && hasSite) return null; // Skip if we only want no-site
        if (site_filter === 'with_site' && !hasSite) return null; // Skip if we only want has-site

        // Construct Lead Object (DB Schema)
        return {
           tenant_id: tenantId, 
           company_name: companyName,
           segment: segment,
           city: location || "Brasil", 
           state: "SP", // Placeholder
           phone: phone,
           whatsapp: phone, // Assume whatsapp
           website: website,
           email: email,
           status: 'lead_novo',
           source: 'google_maps',
           description: `Endereço: ${address}. \n${place.description || ""}`,
           site_classification: siteClassification,
           score: 50 // Default score
        };
    }));

    // Filter nulls
    const leadsToInsert = processedLeads.filter(l => l !== null);

    console.log(`[SEARCH-LEADS] Leads processados válidos: ${leadsToInsert.length}`);

    if (leadsToInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabaseClient
            .from("leads")
            .insert(leadsToInsert)
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
        message: "Nenhum lead atendeu aos critérios de filtro." 
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
