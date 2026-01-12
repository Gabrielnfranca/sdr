import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  company_name: string;
  segment?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  whatsapp?: string | undefined;
  website?: string | undefined;
  tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { leads, source = "csv_import" } = await req.json();

    if (!leads || !Array.isArray(leads)) {
      throw new Error("Invalid leads data");
    }

    console.log(`Processing ${leads.length} leads for tenant ${user.id}`);

    // Validate and normalize leads
    const validLeads: LeadData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      if (!lead.company_name || lead.company_name.trim() === "") {
        errors.push(`Row ${i + 1}: Missing company name`);
        continue;
      }

      // Normalize phone/whatsapp (remove non-digits except +)
      const normalizePhone = (phone: string | undefined | null): string | undefined => {
        if (!phone) return undefined;
        return phone.replace(/[^\d+]/g, "");
      };

      // Normalize email
      const normalizeEmail = (email: string | undefined | null): string | undefined => {
        if (!email) return undefined;
        const trimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) ? trimmed : undefined;
      };

      // Normalize website
      const normalizeWebsite = (website: string | undefined | null): string | undefined => {
        if (!website) return undefined;
        let url = website.trim().toLowerCase();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }
        return url;
      };

      validLeads.push({
        company_name: lead.company_name.trim(),
        segment: lead.segment?.trim() || undefined,
        city: lead.city?.trim() || undefined,
        state: lead.state?.trim() || undefined,
        email: normalizeEmail(lead.email),
        phone: normalizePhone(lead.phone),
        whatsapp: normalizePhone(lead.whatsapp || lead.phone),
        website: normalizeWebsite(lead.website),
        tags: lead.tags || [],
      });
    }

    if (validLeads.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No valid leads found",
          errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicates by email
    const emails = validLeads.filter(l => l.email).map(l => l.email);
    const { data: existingLeads } = await supabaseClient
      .from("leads")
      .select("email")
      .eq("tenant_id", user.id)
      .in("email", emails);

    const existingEmails = new Set(existingLeads?.map(l => l.email) || []);
    const newLeads = validLeads.filter(l => !l.email || !existingEmails.has(l.email));
    const duplicatesCount = validLeads.length - newLeads.length;

    // Insert leads
    const leadsToInsert = newLeads.map(lead => ({
      ...lead,
      tenant_id: user.id,
      source: source,
      status: "lead_novo",
    }));

    const { data: insertedLeads, error: insertError } = await supabaseClient
      .from("leads")
      .insert(leadsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert leads: ${insertError.message}`);
    }

    console.log(`Successfully imported ${insertedLeads?.length || 0} leads`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedLeads?.length || 0,
        duplicates: duplicatesCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in import-leads:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
