
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente (se houver .env local, senão usa hardcoded para teste rápido)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://arlpfhuxbnyexqlzajfs.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybHBmaHV4Ym55ZXhxbHphamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjc2NjcsImV4cCI6MjA4MzgwMzY2N30.tWLnmUY-SmEZfMg2UfUxLLP66lko9qSf_KSyt8HcHMQ";

// URL do n8n LOCAL
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/search";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🚀 Iniciando Ponte Supabase -> n8n...");
console.log(`Monitorando novos leads em: ${SUPABASE_URL}`);
console.log(`Enviando para: ${N8N_WEBHOOK_URL}`);

// Inscreva-se nas mudanças da tabela 'leads'
const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'leads',
    },
    async (payload) => {
      console.log('✨ Novo lead detectado!', payload.new.company_name);
      
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead: payload.new,
            timestamp: new Date().toISOString(),
            source: 'bridge_script'
          }),
        });

        const text = await response.text();
        console.log(`✅ Enviado para n8n. Status: ${response.status}. Resposta: ${text}`);
      } catch (error) {
        console.error('❌ Erro ao enviar para n8n:', error.message);
      }
    }
  )
  .subscribe((status) => {
    console.log(`Status da conexão: ${status}`);
  });

// Mantém o script rodando
process.stdin.resume();
