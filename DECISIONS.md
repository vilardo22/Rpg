# Decisões

Escolhas feitas onde o PRD era ambíguo ou silencioso. Aprovadas em 09/10/2026, salvo indicação.

## Regras de negócio

1. **Cadastro e CPF.** O cadastro roda numa Server Action que valida os dados com zod, verifica se o CPF já existe e cria o usuário pela API admin do Supabase (secret key `SUPABASE_SECRET_KEY`, só no servidor). Assim o erro de "CPF já cadastrado" sai claro em português. As restrições do banco (CPF único, idade) continuam como segunda barreira.
2. **Vagas.** `max_players` conta só os jogadores; o mestre não ocupa vaga.
3. **XP em torneio.** O jogador presente ganha +20 (no lugar de +10). O organizador ganha +15, como em qualquer missão.
4. **Falta (no-show).** Cancelar a participação a qualquer momento antes da conclusão não gera penalidade. A falta (−15) vale só para quem estava aprovado e foi marcado como ausente ao concluir.
5. **Nível mínimo.** É só um aviso ao pedir entrada; não bloqueia o pedido.
6. **Contato.** O mestre informa um celular (o app gera `https://wa.me/55<numero>`) ou cola um link do Discord.
7. **Prompt x PRD.** O guia de prompts cita denúncia de *local*, *horários* do local e notificação de *XP ganho*. Nada disso está no PRD, então não entra: denúncia é só de usuário ou missão.
8. **Seed.** Os usuários fictícios precisam existir no Supabase Auth, então o seed é `scripts/seed.mts` (usa a secret key, roda localmente) e não `seed.sql`.

## Técnicas

- **Next.js 16 sem Cache Components** (Fase 0). O create-next-app liga `cacheComponents` por padrão. Desligamos: todas as telas leem a sessão do Supabase a cada requisição, e o modelo dinâmico tradicional é mais simples de explicar e depurar.
- **Supabase na nuvem, sem ambiente local** (Fase 0). Não há Docker na máquina de desenvolvimento; as migrations são aplicadas no projeto da nuvem (SQL Editor ou `supabase db push`).
- **Fonte dos títulos: Fraunces** (Fase 0). O guia sugeria Cambria, mas ela não existe em Android. Fraunces é serifada, tem personalidade e vem pelo `next/font` (PRD seção 7).
- **Só tema claro** (Fase 0). A identidade (pergaminho + roxo) é clara; não há modo escuro no MVP.
- **Botões e campos com 44px** (Fase 0). Os tamanhos padrão do shadcn (32px) foram aumentados para cumprir a área de toque mínima.

## Fase 1 — banco e cadastro

- **Conta criada já confirmada.** O cadastro usa `auth.admin.createUser` com `email_confirm: true`, então não depende da configuração "Confirm email" do Supabase. No MVP o e-mail não é verificado.
- **Termos aceitos ficam registrados** em `private_profiles.terms_accepted_at` (coluna a mais que o PRD, para a LGPD).
- **XP e níveis em tabelas** (`reputation_rules` e `levels`): é o "lugar único" do RF-05, ajustável com um UPDATE.
- **Permissões por coluna.** Além do RLS, o usuário só pode editar colunas específicas: não muda `role`, CPF, nascimento, nem o `status` da missão (que só muda por `cancel_session`/`complete_session`).
- **Concluir só depois do horário de início**, para ninguém "farmar" XP com missões falsas. O seed cria uma missão em andamento para a demonstração.
- **Mestre pode cancelar a missão inteira** (`cancel_session`, avisa os participantes) e remover um aprovado (`respond_join` com recusa). Apagar missão é permitido enquanto não estiver concluída.
- **Pedidos:** recusado não pode pedir de novo na mesma missão; quem cancelou pode. Ao concluir, pedidos ainda pendentes viram recusados.
- **Participantes aprovados são visíveis** para todos os logados (o detalhe da missão mostra quem vai). Pedidos pendentes, só para o jogador e o mestre.
- **Denúncias:** uma denúncia aberta por pessoa para o mesmo alvo; o selo "Em análise" conta denunciantes diferentes. Denúncia de missão confirmada penaliza o mestre dela.
- **Rejeitar local:** sem missões, é apagado; com missões, só deixa de ser verificado.
- **Testes do banco com PGlite**, um Postgres que roda dentro do Node, já que não há Docker. Um arquivo imita o Supabase (`supabase/tests/supabase-stub.sql`).
- **Node 22.18+**, porque o seed é TypeScript executado direto pelo Node.
