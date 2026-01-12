import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  id: string;
  company_name: string;
  segment: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  website: string | null;
  site_classification: string | null;
  status: string;
}

interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[];
}

interface DecisionRequest {
  lead_id: string;
  message_type?: "initial" | "follow_up_1" | "follow_up_2";
  use_ai_personalization?: boolean;
}

// Replace template variables with lead data
function replaceVariables(template: string, lead: Lead): string {
  return template
    .replace(/\{\{company_name\}\}/g, lead.company_name || "sua empresa")
    .replace(/\{\{segment\}\}/g, lead.segment || "seu segmento")
    .replace(/\{\{city\}\}/g, lead.city || "sua cidade")
    .replace(/\{\{state\}\}/g, lead.state || "")
    .replace(/\{\{website\}\}/g, lead.website || "");
}

// Determine message type based on lead status
function determineMessageType(status: string): "initial" | "follow_up_1" | "follow_up_2" {
  switch (status) {
    case "lead_novo":
      return "initial";
    case "contato_automatico_enviado":
      return "follow_up_1";
    case "follow_up_1":
      return "follow_up_2";
    default:
      return "initial";
  }
}

// Use AI to personalize the message
async function personalizeWithAI(
  subject: string,
  body: string,
  lead: Lead
): Promise<{ subject: string; body: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured, skipping AI personalization");
    return { subject, body };
  }

  try {
    const prompt = `Você é um especialista em copywriting para prospecção B2B de agências de criação de sites.

Dados do lead:
- Empresa: ${lead.company_name}
- Segmento: ${lead.segment || "não informado"}
- Cidade: ${lead.city || "não informada"}
- Site: ${lead.website || "não possui"}
- Classificação: ${lead.site_classification || "não analisado"}

Mensagem atual:
Assunto: ${subject}
Corpo: ${body}

Sua tarefa: Personalize sutilmente a mensagem para torná-la mais relevante para este lead específico. Mantenha o tom consultivo e profissional. NÃO mude a estrutura principal, apenas adicione detalhes relevantes ao segmento/cidade quando possível.

Responda APENAS no formato JSON:
{"subject": "assunto personalizado", "body": "corpo personalizado"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um assistente de copywriting. Responda apenas em JSON válido." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI personalization failed:", response.status);
      return { subject, body };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject || subject,
          body: parsed.body || body,
        };
      }
    }

    return { subject, body };
  } catch (error) {
    console.error("AI personalization error:", error);
    return { subject, body };
  }
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

    const { lead_id, message_type, use_ai_personalization = false }: DecisionRequest = await req.json();

    if (!lead_id) {
      throw new Error("lead_id is required");
    }

    console.log(`SDR Decision Engine processing lead ${lead_id} for tenant ${user.id}`);

    // Fetch lead data
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .eq("tenant_id", user.id)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    // Determine message type based on status if not provided
    const finalMessageType = message_type || determineMessageType(lead.status);
    
    // Determine classification for template selection
    const classification = lead.site_classification || "sem_site";

    console.log(`Lead classification: ${classification}, message type: ${finalMessageType}`);

    // Fetch appropriate template
    // First try tenant-specific template, then fall back to default
    let template: EmailTemplate | null = null;

    // Try tenant-specific template
    const { data: tenantTemplate } = await supabaseClient
      .from("email_templates")
      .select("id, subject, body, variables")
      .eq("tenant_id", user.id)
      .eq("site_classification", classification)
      .eq("message_type", finalMessageType)
      .single();

    if (tenantTemplate) {
      template = tenantTemplate;
    } else {
      // Fall back to default template (tenant_id = '00000000-0000-0000-0000-000000000000')
      const { data: defaultTemplate } = await supabaseClient
        .from("email_templates")
        .select("id, subject, body, variables")
        .eq("tenant_id", "00000000-0000-0000-0000-000000000000")
        .eq("site_classification", classification)
        .eq("message_type", finalMessageType)
        .single();

      template = defaultTemplate;
    }

    if (!template) {
      // If no specific template found, try generic initial template
      const { data: genericTemplate } = await supabaseClient
        .from("email_templates")
        .select("id, subject, body, variables")
        .eq("tenant_id", "00000000-0000-0000-0000-000000000000")
        .eq("message_type", "initial")
        .limit(1)
        .single();

      template = genericTemplate;
    }

    if (!template) {
      throw new Error("No suitable template found");
    }

    // Replace variables in template
    let subject = replaceVariables(template.subject, lead);
    let body = replaceVariables(template.body, lead);

    // Optional AI personalization
    if (use_ai_personalization) {
      const personalized = await personalizeWithAI(subject, body, lead);
      subject = personalized.subject;
      body = personalized.body;
    }

    // Calculate next status based on current message type
    const nextStatus = {
      initial: "contato_automatico_enviado",
      follow_up_1: "follow_up_1",
      follow_up_2: "follow_up_2",
    }[finalMessageType];

    console.log(`SDR Decision: template=${template.id}, nextStatus=${nextStatus}`);

    // --- SEND EMAIL LOGIC (RESEND) ---
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    let emailError = null;

    if (RESEND_API_KEY && lead.email) {
      try {
        console.log(`Sending email to ${lead.email} via Resend...`);
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SDR Automator <onboarding@resend.dev>", // Change this to your verified domain later
            to: [lead.email],
            subject: subject,
            html: body.replace(/\n/g, "<br>"), // Simple conversion to HTML
            text: body,
          }),
        });

        const resendData = await resendRes.json();
        
        if (!resendRes.ok) {
          console.error("Resend API Error:", resendData);
          emailError = resendData;
        } else {
          console.log("Email sent successfully:", resendData);
          emailSent = true;

          // Log contact in database
          await supabaseClient.from("contact_logs").insert({
            tenant_id: user.id,
            lead_id: lead.id,
            channel: "email",
            direction: "outbound",
            message_type: finalMessageType,
            subject: subject,
            content: body,
            sent_at: new Date().toISOString(),
          });

          // Update lead status
          await supabaseClient.from("leads").update({
            status: nextStatus,
            last_contact_date: new Date().toISOString(),
            contact_attempts: (lead.contact_attempts || 0) + 1,
          }).eq("id", lead.id);
        }

      } catch (err) {
        console.error("Failed to send email:", err);
        emailError = err.message;
      }
    } else {
      console.log("Skipping email send: RESEND_API_KEY missing or lead has no email.");
    }
    // ---------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        decision: {
          lead_id: lead.id,
          template_id: template.id,
          message_type: finalMessageType,
          subject,
          body,
          to_email: lead.email,
          next_status: nextStatus,
          classification,
          ai_personalized: use_ai_personalization,
          email_sent: emailSent,
          email_error: emailError
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in sdr-decision-engine:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
