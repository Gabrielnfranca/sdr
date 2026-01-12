import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteAnalysis {
  site_active: boolean;
  site_performance_score: number;
  site_indexed: boolean;
  site_classification: "sem_site" | "site_fraco" | "site_sem_seo" | "site_ok";
}

async function analyzeSite(website: string | null): Promise<SiteAnalysis> {
  // Default: no site
  if (!website) {
    return {
      site_active: false,
      site_performance_score: 0,
      site_indexed: false,
      site_classification: "sem_site",
    };
  }

  try {
    // Check if site is active
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // Increased timeout

    // Use GET directly as many sites block HEAD or return 405
    // We need the content anyway for SEO analysis
    const response = await fetch(website, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ProspectFlow/1.0; +https://prospectflow.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`Site ${website} returned status ${response.status}`);
      // If 403/405/5xx, it might still be a valid site but blocking bots
      // But for now we classify as weak if we can't access it
      return {
        site_active: false,
        site_performance_score: 0,
        site_indexed: false,
        site_classification: "site_fraco",
      };
    }

    // Site is active, now analyze content
    const html = await response.text();
    
    // Basic SEO checks
    const hasTitle = /<title[^>]*>.+<\/title>/i.test(html);
    const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
    const hasH1 = /<h1[^>]*>.+<\/h1>/i.test(html);
    const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
    const hasSSL = website.startsWith("https://");
    
    // Calculate score (0-100)
    let score = 20; // Base score for being active
    if (hasTitle) score += 20;
    if (hasMetaDescription) score += 20;
    if (hasH1) score += 15;
    if (hasViewport) score += 15;
    if (hasSSL) score += 10;

    // Check basic Google indexing (simplified check)
    const hasRobotsNoindex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["'][^>]*>/i.test(html);
    const isIndexed = !hasRobotsNoindex;

    // Determine classification
    let classification: SiteAnalysis["site_classification"];
    if (score < 40) {
      classification = "site_fraco";
    } else if (score < 70) {
      classification = "site_sem_seo";
    } else {
      classification = "site_ok";
    }

    return {
      site_active: true,
      site_performance_score: score,
      site_indexed: isIndexed,
      site_classification: classification,
    };

  } catch (error) {
    console.error(`Error analyzing site ${website}:`, error);
    return {
      site_active: false,
      site_performance_score: 0,
      site_indexed: false,
      site_classification: "site_fraco",
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use Service Role Key to bypass RLS for internal triggers
      // { global: { headers: { Authorization: authHeader } } } // Removed user auth requirement for internal calls
    );

    // Optional: Check user auth only if NOT using service role (for manual calls from UI)
    // For simplicity in this automation context, we'll assume the caller has the right key (Service Role or User JWT)
    // But to be safe, if it's a user call, we might want to respect RLS.
    // However, since search-leads calls this with Service Role Key, we should default to that.
    
    /* 
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
       // If no user, check if it's a service role call? 
       // Actually, createClient with Service Role Key bypasses getUser check usually.
       // Let's simplify: We trust the key provided in the header or env.
    }
    */

    const { lead_id, website, batch = false, limit = 10 } = await req.json();

    if (batch) {
      // Batch mode: analyze multiple leads that haven't been analyzed yet
      const { data: leads, error: fetchError } = await supabaseClient
        .from("leads")
        .select("id, website")
        // .eq("tenant_id", user.id) // Removed tenant check
        .is("site_analysis_date", null)
        .not("website", "is", null)
        .limit(limit);

      if (fetchError) throw fetchError;

      console.log(`Analyzing ${leads?.length || 0} sites in batch mode`);

      const results = [];
      for (const lead of leads || []) {
        const analysis = await analyzeSite(lead.website);
        
        const { error: updateError } = await supabaseClient
          .from("leads")
          .update({
            ...analysis,
            site_analysis_date: new Date().toISOString(),
          })
          .eq("id", lead.id);

        if (updateError) {
          console.error(`Failed to update lead ${lead.id}:`, updateError);
        } else {
          results.push({ id: lead.id, ...analysis });
        }
      }

      return new Response(
        JSON.stringify({ success: true, analyzed: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (lead_id) {
      // Single lead mode
      let targetWebsite = website;
      
      // If website not provided in body, fetch from DB
      if (!targetWebsite) {
        const { data: lead, error: fetchError } = await supabaseClient
          .from("leads")
          .select("id, website")
          .eq("id", lead_id)
          // .eq("tenant_id", user.id) // Removed tenant check for internal calls (service role)
          .single();

        if (fetchError || !lead) {
          throw new Error("Lead not found");
        }
        targetWebsite = lead.website;
      }

      console.log(`Analyzing site for lead ${lead_id}: ${targetWebsite}`);

      const analysis = await analyzeSite(targetWebsite);

      // Use service role client if available (for internal triggers) or stick to user client
      // For now, we use the client created with the auth header passed
      const { error: updateError } = await supabaseClient
        .from("leads")
        .update({
          ...analysis,
          site_analysis_date: new Date().toISOString(),
        })
        .eq("id", lead_id);

      if (updateError) throw updateError;

      // --- TRIGGER SDR DECISION ENGINE ---
      // If the site has issues (not "site_ok"), trigger the SDR engine to send an email
      if (analysis.site_classification !== "site_ok") {
        console.log(`Triggering SDR Decision Engine for lead ${lead_id} (Classification: ${analysis.site_classification})`);
        
        const sdrFunctionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sdr-decision-engine`;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // Fire and forget
        fetch(sdrFunctionUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            lead_id: lead_id,
            message_type: "initial", // Start with initial message
            use_ai_personalization: true // Enable AI if key is present
          }),
        }).catch(err => console.error(`Failed to trigger SDR engine for ${lead_id}:`, err));
      }
      // -----------------------------------

      return new Response(
        JSON.stringify({ success: true, ...analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      throw new Error("Either lead_id or batch mode is required");
    }

  } catch (error: unknown) {
    console.error("Error in analyze-site:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
