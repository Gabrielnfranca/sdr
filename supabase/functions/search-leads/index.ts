
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// Helper to extract emails from text
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

// Helper to fetch and scrape a URL
async function scrapeEmailFromUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000); // 5s timeout
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ProspectFlow/1.0; +https://prospectflow.com)"
      }
    });
    const text = await res.text();
    const emails = extractEmails(text);
    // Filter common false positives
    const valid = emails.find(e => !e.endsWith('.png') && !e.endsWith('.jpg') && e.length < 50 && !e.includes('wix.com') && !e.includes('sentry'));
    return valid || null;
  } catch {
    return null;
  }
}

// Helper to search Google (requires CX)
async function searchGoogleForEmail(company: string, city: string, apiKey: string, cx: string): Promise<string | null> {
  if (!cx || !apiKey) return null;
  
  const query = `"${company}" "${city}" email OR contato OR "@gmail.com" OR "@hotmail.com" -site:instagram.com/p/`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.items) return null;

    for (const item of data.items) {
      const snippet = item.snippet || "";
      const title = item.title || "";
      const text = snippet + " " + title;
      
      const emails = extractEmails(text);
      const validEmail = emails.find(e => !e.includes('wix.com') && !e.includes('sdr') && !e.endsWith('.png'));
      if (validEmail) return validEmail;
    }
  } catch (err) {
    console.error("Error searching for email:", err);
  }
  return null;
}

// Use serve from std library for better compatibility
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    // Not throwing error immediately to allow debug response
    
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      });
    }

    const { query, limit = 10, siteFilter = 'all' } = requestData;

    if (!query) {
       return new Response(JSON.stringify({ success: false, error: "Query param is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // --- AUTH CHECK ---
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader ?? "" } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    // Handle auth errors more gracefully
    if (userError) {
       console.error("Auth Fail:", userError);
       let errorMessage = userError.message;
       let status = 200; // Default to 200 to show in UI as error message

       if (
          errorMessage.includes("missing sub claim") || 
          errorMessage.includes("signature is invalid") ||
          errorMessage.includes("jwt expired") ||
          errorMessage.includes("invalid JWT")
       ) {
          errorMessage = "Sessão expirada ou inválida. Por favor, faça login novamente.";
          // Keep 200 to allow the generic client wrapper to parses the JSON error message
          status = 200; 
       }

       return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: status
      });
    }
    // ------------------

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    // Force MOCK MODE if API Key is known to be bad locally or in dev
    // Check for empty or obviously placeholder keys
    const isMockMode = false; // FORCE REAL MODE

    if (!query) {
      throw new Error("Query is required");
    }

    let leadsToInsert: any[] = [];

    // --- MOCK GENERATOR FUNCTION ---
    const generateMockLeads = (qty: number, filter: string, queryStr: string) => {
        const category = queryStr.split(' ')[0] || "Empresa";
        const cityMock = queryStr.includes(' em ') ? queryStr.split(' em ')[1] : "São Paulo";
        const mocks: any[] = [];
        
        for (let i = 0; i < qty; i++) {
           const suffix = Math.floor(Math.random() * 10000);
           let type = 'site_ok';
           let website: string | null = `https://www.${category.toLowerCase()}${suffix}.com.br`;
           let siteClass = 'site_ok';

           // Force types based on filter
           if (filter === 'without_site') {
              // 80% chance of 'sem_site', 20% 'site_fraco' (which is also "bad")
              if (Math.random() > 0.2) {
                 type = 'sem_site';
                 website = null;
                 siteClass = 'sem_site';
              } else {
                 type = 'site_fraco';
                 website = `http://broken-site-${suffix}.com`;
                 siteClass = 'site_fraco';
              }
           } else if (filter === 'with_site') {
              type = 'site_ok'; // Or site_sem_seo
              siteClass = 'site_ok';
           } else {
               // Random mix
               const r = Math.random();
               if (r < 0.3) { type = 'sem_site'; website = null; siteClass = 'sem_site'; }
               else if (r < 0.6) { type = 'site_fraco'; website = `http://old-${suffix}.net`; siteClass = 'site_fraco'; }
           }

           mocks.push({
             company_name: `${category} Mock ${suffix}`,
             website: website,
             phone: `(11) 9${Math.floor(Math.random()*9000)+1000}-${Math.floor(Math.random()*9000)+1000}`,
             email: website ? `contato@${category.toLowerCase()}${suffix}.com.br` : null,
             city: cityMock,
             source: 'manual', // Mark as manual/mock to differentiate
             status: 'lead_novo',
             site_classification: siteClass,
             notes: `[SIMULAÇÃO] Dados gerados localmente pois a API Google retornou erro ou está desativada.`
           });
        }
        return mocks;
    };

    if (isMockMode) {
      console.log("Running in MOCK MODE (Key invalid or missing)");
      leadsToInsert = generateMockLeads(limit, siteFilter, query);
    } else {
      // Search Google Places API (New) - Text Search
      console.log(`Using Google Places API (New)... Target: ${limit} results`);
      const searchUrl = "https://places.googleapis.com/v1/places:searchText";
      
      let nextPageToken = undefined;
      let totalFetched = 0;
      // Cap at 100
      const maxResults = Math.min(limit, 100); 

      do {
        const requestBody: any = {
          textQuery: query,
          pageSize: 20 // Max per page
        };
        
        if (nextPageToken) {
          requestBody.pageToken = nextPageToken;
        }

        const searchRes = await fetch(searchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,nextPageToken"
          },
          body: JSON.stringify(requestBody)
        });

        const searchData = await searchRes.json();

        if (!searchRes.ok) {
          const errorBody = JSON.stringify(searchData);
          console.error(`Google Places API Error: ${searchRes.status} - ${errorBody}`);
          
          throw new Error(`Google API falhou: ${searchRes.status} - ${errorBody}`);
        }

      
      // Parallel processing of places to avoid timeout
      const places = searchData.places || [];
      const processPlace = async (place: any) => {
        try {
          const hasSite = !!place.websiteUri;
          let notes = `Endereço: ${place.formattedAddress || 'N/A'}`;
          let siteClassification = null;
          let email: string | null = null;
          
          // 1. Initial Classification (Sem Site)
          if (!hasSite) {
              siteClassification = 'sem_site';
          } 
          // 2. Analyze Site Quality (Always run if there is a site)
          else {
              try {
                  const controller = new AbortController();
                  setTimeout(() => controller.abort(), 6000); // 6s timeout (faster)
                  
                  const res = await fetch(place.websiteUri, { 
                      method: 'GET', 
                      signal: controller.signal,
                      headers: { "User-Agent": "Bot/1.0" } 
                  });

                  if (!res.ok) {
                      siteClassification = 'site_fraco';
                      notes += `\n[CLASSIFICACAO] Site retornou erro ${res.status}.`;
                  } else {
                      const html = await res.text();

                      // Tenta extrair email do HTML baixado (otimização para evitar segundo request)
                      if (!email) {
                        const emailsFound = extractEmails(html);
                        const valid = emailsFound.find(e => !e.endsWith('.png') && !e.endsWith('.jpg') && e.length < 50 && !e.includes('wix.com') && !e.includes('sentry') && !e.includes('example.com'));
                        if (valid) email = valid;
                      }

                      const isResponsive = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
                      const hasTitle = /<title[^>]*>.+<\/title>/i.test(html);
                      
                      if (!isResponsive) {
                          siteClassification = 'site_fraco';
                          notes += `\n[CLASSIFICACAO] Site não responsivo.`;
                      } else if (!hasTitle || html.length < 300) {
                          siteClassification = 'site_sem_seo';
                          notes += `\n[CLASSIFICACAO] Site com pouco conteúdo/SEO.`;
                      } else {
                          siteClassification = 'site_ok';
                      }
                  }
              } catch (err) {
                  siteClassification = 'site_fraco';
                  notes += `\n[CLASSIFICACAO] Falha ao acessar site: ${err.message}`;
              }
          }

          // 3. Apply Filters
          if (siteFilter === 'with_site' && !hasSite) return null;
          if (siteFilter === 'without_site') {
              // Discard if the site is perfectly fine
              if (siteClassification === 'site_ok') return null;
          }

          let city = null;
          if (place.formattedAddress) {
            const parts = place.formattedAddress.split(',');
            if (parts.length >= 3) {
               const cityStatePart = parts.find((p: string) => p.includes(' - ') && p.trim().length < 40);
               if (cityStatePart) {
                 city = cityStatePart.split(' - ')[0].trim();
               } else {
                 city = parts[parts.length - 3]?.trim() || parts[parts.length - 2]?.trim();
               }
            }
          }

          // Removed duplicate declaration
          // let email = null;
          
          // Temporarily disable heavy scraping to prevent timeouts provided we are debugging
          // if (place.websiteUri) {
          //   email = await scrapeEmailFromUrl(place.websiteUri);
          // }

          if (!email) {
            const cx = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");
            const searchApiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY") || apiKey;
            // Only run secondary search if we have dedicated keys, to save time/quota
            if (cx && searchApiKey) {
               // Executa busca secundária se houver credenciais
               email = await searchGoogleForEmail(place.displayName?.text || "", city || "", searchApiKey, cx);
            }
          }

          return {
            company_name: place.displayName?.text || "Empresa sem nome",
            website: place.websiteUri || null,
            phone: place.nationalPhoneNumber || null,
            email: email,
            city: city || "Desconhecida",
            source: 'google_maps',
            status: 'lead_novo',
            site_classification: siteClassification, // Nova propriedade
            notes: notes
          };
        } catch (e) {
          console.error(`Error processing place ${place.displayName?.text}:`, e);
          return null;
        }
      };

      // Process in batches of 5 to respect resources
      const processedResults: any[] = [];
      const batchSize = 5;
      for (let i = 0; i < places.length; i += batchSize) {
        const batch = places.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processPlace));
        processedResults.push(...batchResults.filter(r => r !== null));
      }
      
      leadsToInsert.push(...processedResults);

        // Check if we have enough LEADS (not just fetched places)
        if (leadsToInsert.length >= maxResults || !searchData.nextPageToken) break;

        nextPageToken = searchData.nextPageToken;

      } while (nextPageToken);
    }

    // Insert into Supabase (Client already created above)
    /* const supabaseClient = createClient... (removed redundant creation) */

    const leadsWithTenant = leadsToInsert.map(lead => ({
      ...lead,
      tenant_id: user.id
    }));

    // Filter out duplicates based on website before inserting
    // This avoids the need for a unique constraint on the database side for now
    const websitesToCheck = leadsWithTenant
      .map(l => l.website)
      .filter(w => w !== null && w !== undefined && w !== "");
    
    let existingWebsites = new Set();
    
    if (websitesToCheck.length > 0) {
      const { data: existing, error: checkError } = await supabaseClient
        .from("leads")
        .select("website")
        .in("website", websitesToCheck)
        .eq("tenant_id", user.id);
        
      if (!checkError && existing) {
        existing.forEach(e => existingWebsites.add(e.website));
      }
    }

    const leadsToInsertFinal = leadsWithTenant.filter(l => {
      // If no website, always insert (or you could check company name)
      if (!l.website) return true;
      // If website exists in DB, skip
      return !existingWebsites.has(l.website);
    });

    let data = [];
    let error = null;

    if (leadsToInsertFinal.length > 0) {
      const result = await supabaseClient
        .from("leads")
        .insert(leadsToInsertFinal)
        .select();
        
      data = result.data || [];
      error = result.error;

      // --- INTEGRAÇÃO N8N (Opcional) ---
      // Se houver URL configurada no ambiente (N8N_WEBHOOK_URL), envia.
      const n8nUrl = Deno.env.get("N8N_WEBHOOK_URL");

      if (data.length > 0 && n8nUrl) {
        console.log(`Enviando ${data.length} leads para o n8n: ${n8nUrl}`);
        
        // Dispara sem esperar (fire-and-forget) para não travar a resposta
        fetch(n8nUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            leads: data,
            query: query,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error("Erro ao enviar para n8n:", err));

      }
      // ----------------------
    } else {
      data = [];
    }

    if (error) throw error;

    // Trigger analysis for new leads asynchronously
    if (data && data.length > 0) {
      // We don't await this to return fast to the UI
      const leadsToAnalyze = data.filter(l => l.website); // Only analyze if has website
      
      if (leadsToAnalyze.length > 0) {
        console.log(`Triggering analysis for ${leadsToAnalyze.length} leads...`);
        
        // Call analyze-site function for each lead
        // In a real production scenario, you might want to use a queue or a background job
        // For now, we'll fire and forget fetch calls to our own function
        const analyzeFunctionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-site`;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        for (const lead of leadsToAnalyze) {
          fetch(analyzeFunctionUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lead_id: lead.id, website: lead.website }),
          }).catch(err => console.error(`Failed to trigger analysis for ${lead.id}:`, err));
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: data.length, leads: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in search-leads function:", error);
    // Return 200 even on error so the frontend can read the JSON body for the error message
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
