

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
    const { query } = body;

    // Configuration Check
    const serpApiKey = Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) {
        console.error("Missing SERPAPI_KEY");
        throw new Error("Server Configuration Error (Missing Key)");
    }

    // If no query, return empty or error
    if (!query) {
         return new Response(JSON.stringify({ success: false, error: "Query parameter missing" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // Execute Search
    const networks = "(site:linkedin.com/posts OR site:instagram.com OR site:facebook.com)";
    const fullQuery = `${query} ${networks}`;
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(fullQuery)}&api_key=${serpApiKey}&num=10&google_domain=google.com.br&gl=br&hl=pt`;
    
    console.log("Fetching from SerpApi...");
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text();
        console.error("SerpApi fail:", txt);
        throw new Error(`External API Error: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
        throw new Error(`SerpApi Logic Error: ${data.error}`);
    }

    // Map Result
    const organic = data.organic_results || data.organic_results_state || [];
    const leads = organic.map((item: any) => ({
        tenant_id: user.id,
        company_name: (item.title || "Social Lead").substring(0, 100),
        status: "lead_novo",
        source: "social_search",
        notes: item.snippet || "Sem descrição",
        website: item.link
    }));

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

