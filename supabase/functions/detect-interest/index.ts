import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interest detection keywords (Portuguese)
const INTEREST_KEYWORDS = [
  "quero saber mais",
  "gostaria de saber",
  "quanto custa",
  "qual o valor",
  "valor",
  "preço",
  "orçamento",
  "fazer um site",
  "criar um site",
  "criar site",
  "novo site",
  "melhorar o site",
  "atualizar o site",
  "reformular",
  "interessado",
  "me interessa",
  "tenho interesse",
  "pode me ligar",
  "meu contato",
  "meu telefone",
  "vamos conversar",
  "marcar uma reunião",
  "agendar",
  "proposta",
  "apresentação",
];

// Negative/opt-out keywords
const OPTOUT_KEYWORDS = [
  "não tenho interesse",
  "não quero",
  "pare de enviar",
  "remover",
  "descadastrar",
  "não me envie",
  "spam",
  "cancelar",
];

interface AnalysisResult {
  interest_detected: boolean;
  opted_out: boolean;
  interest_keywords: string[];
  confidence: number;
}

function analyzeMessage(message: string): AnalysisResult {
  const normalizedMessage = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Check for opt-out first
  for (const keyword of OPTOUT_KEYWORDS) {
    const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizedMessage.includes(normalizedKeyword)) {
      return {
        interest_detected: false,
        opted_out: true,
        interest_keywords: [],
        confidence: 1.0,
      };
    }
  }

  // Check for interest
  const foundKeywords: string[] = [];
  for (const keyword of INTEREST_KEYWORDS) {
    const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizedMessage.includes(normalizedKeyword)) {
      foundKeywords.push(keyword);
    }
  }

  const interest_detected = foundKeywords.length > 0;
  const confidence = Math.min(foundKeywords.length * 0.3, 1.0);

  return {
    interest_detected,
    opted_out: false,
    interest_keywords: foundKeywords,
    confidence,
  };
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { lead_id, message, channel = "email" } = await req.json();

    if (!lead_id || !message) {
      throw new Error("lead_id and message are required");
    }

    console.log(`Analyzing message for lead ${lead_id}`);

    // Analyze the message
    const analysis = analyzeMessage(message);

    // Log the contact/response
    const { error: logError } = await supabaseClient
      .from("contact_logs")
      .insert({
        lead_id,
        tenant_id: user.id,
        channel,
        message_type: "response",
        direction: "inbound",
        response_content: message,
        interest_detected: analysis.interest_detected,
        interest_keywords: analysis.interest_keywords,
        responded_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log contact:", logError);
    }

    // Update lead status based on analysis
    if (analysis.opted_out) {
      // Opt-out detected: mark as opted out and stop automation
      await supabaseClient
        .from("leads")
        .update({
          opted_out: true,
          opted_out_date: new Date().toISOString(),
          automation_paused: true,
          status: "perdido",
        })
        .eq("id", lead_id)
        .eq("tenant_id", user.id);

      console.log(`Lead ${lead_id} opted out`);

    } else if (analysis.interest_detected) {
      // Interest detected: update status and create task
      await supabaseClient
        .from("leads")
        .update({
          status: "lead_com_interesse",
          automation_paused: true,
        })
        .eq("id", lead_id)
        .eq("tenant_id", user.id);

      // Get lead details for task
      const { data: lead } = await supabaseClient
        .from("leads")
        .select("company_name")
        .eq("id", lead_id)
        .single();

      // Create task for human follow-up
      await supabaseClient
        .from("tasks")
        .insert({
          tenant_id: user.id,
          lead_id,
          title: `🔥 Interesse detectado: ${lead?.company_name || "Lead"}`,
          description: `Palavras-chave encontradas: ${analysis.interest_keywords.join(", ")}\n\nMensagem original:\n"${message}"`,
          task_type: "follow_up",
          priority: "urgent",
          status: "pending",
          due_date: new Date().toISOString(),
        });

      console.log(`Interest detected for lead ${lead_id}, task created`);

    } else {
      // No interest yet, mark as engaged
      await supabaseClient
        .from("leads")
        .update({
          status: "lead_engajado",
        })
        .eq("id", lead_id)
        .eq("tenant_id", user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in detect-interest:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
