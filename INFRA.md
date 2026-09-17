# ⚙️ Configurações de Infraestrutura — SetVote

## 🕐 Supabase Keepalive (Cron Job)

**Status:** ✅ ATIVO  
**Ativado em:** 25/05/2026  
**Serviço:** [cron-job.org](https://cron-job.org) (gratuito)  

### O que faz
Faz um ping no Supabase a cada 3 dias para evitar que o banco pause (limitação do plano gratuito do Supabase pausa após 7 dias sem uso).

### Configuração do Job
| Campo | Valor |
|---|---|
| **Nome** | SetVote — Supabase Keepalive |
| **URL pingada** | `https://zsqjhzufuhjgjlrnkcky.supabase.co/rest/v1/profiles?select=id&limit=1` |
| **Frequência** | A cada 3 dias (`0 8 */3 * *`) |
| **Método** | GET |
| **Header** | `apikey: sb_publishable_XbBpvZWRcRMQhRwUN7cSPw_Peoqim7P` |

### Teste manual
```bash
node keepalive.js
```

---

## 🗄️ Banco de Dados

**Provedor:** Supabase (plano gratuito)  
**Projeto:** `zsqjhzufuhjgjlrnkcky`  
**URL:** `https://zsqjhzufuhjgjlrnkcky.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/zsqjhzufuhjgjlrnkcky

---

## 🚀 Hospedagem

**Provedor:** EasyPanel  
**URL do app:** https://ssvote-ssvote.zborhs.easypanel.host/  

---

## 🔐 Segurança

- RLS habilitado em todas as tabelas (incluindo `dedications` — corrigido em 25/03/2026)
- Rotas admin protegidas por autenticação Supabase
