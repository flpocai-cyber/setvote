/**
 * keepalive.js — Mantém o Supabase ativo para não pausar
 * 
 * Como usar manualmente:
 *   node keepalive.js
 * 
 * Ou configure um cron externo (cron-job.org) para chamar a URL do Supabase.
 * Veja o README ou o guia no KEEPALIVE_SETUP.md
 */

const SUPABASE_URL = 'https://zsqjhzufuhjgjlrnkcky.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_XbBpvZWRcRMQhRwUN7cSPw_Peoqim7P'

async function ping() {
    const now = new Date().toISOString()
    console.log(`[${now}] 🏓 Pingando Supabase...`)

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                }
            }
        )

        if (response.ok) {
            console.log(`[${now}] ✅ Supabase respondeu com status ${response.status} — banco ativo!`)
        } else {
            console.error(`[${now}] ❌ Supabase retornou erro: ${response.status} ${response.statusText}`)
        }
    } catch (err) {
        console.error(`[${now}] ❌ Erro de conexão: ${err.message}`)
    }
}

ping()
