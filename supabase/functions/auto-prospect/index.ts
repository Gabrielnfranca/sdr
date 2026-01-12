import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  bcc?: string;
  reply_to?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    // Configurações de Email (Idealmente viriam de uma tabela de configurações ou variáveis de ambiente)
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev"; // Use seu domínio verificado aqui
    const SENDER_NAME = Deno.env.get("SENDER_NAME") || "SDR Automator";
    const REPLY_TO_EMAIL = Deno.env.get("REPLY_TO_EMAIL"); // Seu email pessoal para respostas
    const BCC_EMAIL = Deno.env.get("BCC_EMAIL"); // Seu email pessoal para cópia oculta

    const { limit = 5 } = await req.json();

    // 1. Buscar leads elegíveis (sem site, status 'lead_novo', com email)
    const { data: leads, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "lead_novo")
      .is("website", null)
      .not("email", "is", null)
      .limit(limit);

    if (fetchError) throw fetchError;

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum lead elegível encontrado.", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const lead of leads) {
      try {
        // VERIFICAÇÃO DE DUPLICIDADE
        // Checar se já enviamos email para este lead ou para este endereço de email
        const { data: existingLogs } = await supabase
          .from("email_logs")
          .select("id")
          .or(`lead_id.eq.${lead.id},email_address.eq.${lead.email}`)
          .limit(1);

        if (existingLogs && existingLogs.length > 0) {
          console.log(`Skipping duplicate lead: ${lead.email}`);
          results.push({ id: lead.id, status: "skipped", reason: "duplicate_email" });
          continue;
        }

        // 2. Gerar mensagem (Personalizada para Gabriel França)
        const message = `
          <div style="font-family: sans-serif; color: #333;">
            <p>Olá <strong>${lead.company_name}</strong>,</p>
            <p>Encontrei sua empresa no Google Maps em <strong>${lead.city || "sua região"}</strong> e notei que vocês ainda não possuem um site linkado no perfil.</p>
            <p>Hoje em dia, ter uma presença digital forte é essencial para atrair novos clientes.</p>
            <p>Eu ajudo empresas locais a se destacarem na internet e venderem mais. Teria interesse em ver como eu poderia ajudar a <strong>${lead.company_name}</strong>?</p>
            <br>
            <p>Atenciosamente,</p>
            <div style="margin-top: 10px; border-left: 3px solid #000; padding-left: 10px;">
              <p style="margin: 0; font-weight: bold;">Gabriel França</p>
              <p style="margin: 0; color: #666; font-size: 0.9em;">Especialista em Presença Digital</p>
              <p style="margin: 0; color: #666; font-size: 0.9em;"><a href="mailto:gabrielnfranca@outlook.com">gabrielnfranca@outlook.com</a></p>
            </div>
          </div>
        `;
        const subject = `Pergunta sobre a ${lead.company_name}`;

        // 3. Enviar Email via Resend
        let emailStatus = "sent";
        let emailMetadata = { provider: "resend_simulated" };

        if (RESEND_API_KEY) {
          const emailData: ResendEmail = {
            from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            to: lead.email,
            subject: subject,
            html: message,
          };

          if (BCC_EMAIL) emailData.bcc = BCC_EMAIL;
          if (REPLY_TO_EMAIL) emailData.reply_to = REPLY_TO_EMAIL;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify(emailData),
          });

          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.message || "Erro ao enviar email via Resend");
          }
          
          emailMetadata = { provider: "resend", id: data.id };
          console.log(`Email enviado via Resend para ${lead.email}`);
        } else {
          console.log(`[SIMULAÇÃO] Enviando email para ${lead.email} (BCC: ${BCC_EMAIL})`);
        }

        // 4. Registrar no Log de Emails
        const { error: logError } = await supabase
          .from("email_logs")
          .insert({
            lead_id: lead.id,
            email_address: lead.email,
            subject: subject,
            status: emailStatus,
            metadata: emailMetadata
          });

        if (logError) throw logError;

        // 5. Atualizar status do lead
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            status: "contato_automatico_enviado",
            last_contact_date: new Date().toISOString(),
            notes: (lead.notes || "") + `\n[Auto-Prospect] Email enviado em ${new Date().toLocaleDateString()}`
          })
          .eq("id", lead.id);

        if (updateError) throw updateError;

        results.push({ id: lead.id, status: "sent", email: lead.email });
      } catch (err) {
        console.error(`Erro processando lead ${lead.id}:`, err);
        results.push({ id: lead.id, status: "error", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length, 
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
