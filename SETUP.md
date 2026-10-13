# Setup — BORG Business OS

Passos que só tu podes fazer (contas e chaves). Depois de os completares, preenche o `.env.local` e diz ao Claude para continuar.

## 1. Supabase (base de dados + auth) — grátis

1. Vai a [supabase.com](https://supabase.com) → **Start your project** → cria conta (podes usar o GitHub)
2. **New project**:
   - Nome: `borg-business-os`
   - Database password: gera uma forte e guarda-a
   - Região: **West EU (Ireland)** (mais próxima de Portugal)
   - Plano: Free
3. Quando o projeto estiver criado, vai a **Settings → API** e copia para o `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secreta, nunca partilhar)
4. **Criar o teu utilizador**: painel → **Authentication → Users → Add user** → o teu email + password à tua escolha → marca "Auto Confirm User"
5. **Desativar registos públicos**: **Authentication → Sign In / Up → desativa "Allow new users to sign up"**

## 2. Anthropic (API dos agentes) — pagamento por uso

1. Vai a [console.anthropic.com](https://console.anthropic.com) → cria conta
2. **Billing** → adiciona cartão e carrega **US$ 5** de crédito (chega para semanas de uso)
3. **Recomendado**: em Billing, define um **limite de gasto mensal** (ex.: US$ 20) para nunca haver surpresas
4. **API Keys → Create Key** → nome `borg-business-os` → copia a chave (só aparece uma vez) → `ANTHROPIC_API_KEY` no `.env.local`

## 3. Aplicar as migrations (criar as tabelas)

No painel do Supabase → **SQL Editor** → cola e corre, **por ordem**, o conteúdo de cada ficheiro em `supabase/migrations/` (0001 → 0006).

(Alternativa por CLI: `npx supabase link --project-ref <ref>` e `npx supabase db push`.)

## 4. Carregar a memória e os leads

```bash
cd borg-business-os

npm run seed:knowledge   # copia as bases de conhecimento (G4 + frameworks) para o vault
npm run sync             # sobe as notas do vault Obsidian para o Supabase (~120+ notas)
npm run import:leads     # dry-run da importação dos Excel de prospecção
npm run import:leads -- --commit   # importa de verdade
```

## 5. Testar

```bash
npm run dev
```

Abre http://localhost:3000:
1. Login com o utilizador do passo 1.4
2. **Memória** → deves ver as notas do vault com busca
3. **Pipeline** → leads importados dos Excel
4. **Agentes → Gestão** → pergunta "qual é o nosso ICP?" — deve pesquisar a memória e citar notas reais
5. **Agentes → Metas** → cria uma meta em /metas (ex.: MRR €1.500 até 2026-12-31) e pergunta "como estamos vs a meta?"

## 6. Deploy na Vercel (quando quiseres a app acessível de qualquer lado)

1. Cria um repo **privado** no GitHub e faz push (`git remote add origin … && git push -u origin main`)
2. [vercel.com](https://vercel.com) → Import do repo → Framework: Next.js
3. Em **Environment Variables**, adiciona `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (⚠️ **não** adiciones `VAULT_PATH` — o sync corre só no teu Mac)
4. Deploy. O `npm run sync` local continua a funcionar contra o mesmo Supabase.

## Rotina de uso

- Editas notas no Obsidian → `npm run sync` quando quiseres atualizar a memória dos agentes
- Notas escritas pelos agentes aparecem no vault em `09 - Agentes/` após o sync
- ⚠️ O Supabase free pausa após ~7 dias sem uso; com uso diário não acontece (o painel permite retomar)
