# Roteiro de demonstração (vídeo)

Segue a seção 11 do PRD. Duração sugerida: 5 a 7 minutos. Grave no celular ou no navegador em modo celular (F12 → Ctrl+Shift+M, largura 390px).

## Antes de gravar

1. Rode `npm run seed` para recriar os dados de demonstração (apaga só os dados de teste e as contas `@demo.quadro.dev`).
   - A missão **"Ordem Paranormal — capítulo 3"** é criada "em andamento" (começou 1 hora antes do seed): rode o seed **até 1 dia antes** de gravar, senão ela some da aba "Minhas".
2. Use **duas janelas**: uma normal e uma anônima (cada uma logada numa conta).
3. Confira se o endereço do Joy Joy Café já foi confirmado com o Arthur (hoje está como "a confirmar").

**Contas** (senha de todas: `Missoes2026!`):

| Conta | Papel na demo |
|---|---|
| `aria@demo.quadro.dev` | Mestre (nível 4) |
| `enzo@demo.quadro.dev` | Jogador novato |
| `admin@demo.quadro.dev` | Admin (painel) |
| `bruno@`, `celi@`, `duda@demo.quadro.dev` | Outros jogadores |

## Cenas

### 1. Cadastro (mostrar o erro de CPF inválido) · ~1 min
- Abra a home pública: mostre a proposta, as próximas missões e os locais.
- **Criar conta** → preencha com CPF `111.111.111-11` → envie → aparece **"CPF inválido"**.
- Troque por um CPF válido de teste (gere em um gerador de CPF *de teste*), data de nascimento de adulto, aceite os termos → cai logado em **Missões**.
- (Opcional) mostre que uma data de nascimento de menor de 18 é recusada.

### 2. Mapa de locais com o Joy Joy Café · ~40 s
- Aba **Locais** → mapa com os pinos → toque no **Joy Joy Café**: o balão mostra os jogos e as próximas missões.
- **Ver local** → página do local com "Como chegar" e a agenda.

### 3. Mestre cria uma missão presencial no local verificado · ~1 min
- Janela 1, logado como **Aria** → **Criar** → título, RPG, data de amanhã, local **Joy Joy Café**, 4 jogadores, WhatsApp.
- Comente: o local só aparece na lista porque é **verificado**; o WhatsApp **não** fica visível para ninguém ainda.
- **Publicar missão**.

### 4. Outro usuário pede para entrar; o mestre aprova; o contato aparece · ~1 min 30 s
- Janela 2, logado como **Enzo** → **Missões** → abra a missão da Aria → mostre que o contato **não aparece** → **Pedir para entrar**.
- Janela 1 (Aria) → **Avisos** mostra o contador → toque no aviso → em **Pedidos de entrada** aparece o Enzo com nível e faltas → **Aprovar**.
- Janela 2 (Enzo) → recarregue → aparece **"Abrir WhatsApp do mestre"**.

### 5. Mestre conclui a missão marcando presença e falta · ~1 min
- Janela 1 (Aria) → **Missões → Minhas → "Ordem Paranormal — capítulo 3"** (em andamento).
- Em **Concluir missão**, desmarque a **Duda** (faltou) → **Concluir** → confirme.
- Mostre os selos "Compareceu"/"Faltou" e o botão **Criar a próxima** (missão semanal).

### 6. Perfil mostra XP, nível e histórico atualizados · ~40 s
- Toque no nome do **Bruno** (+10 XP) e da **Duda** (−15 XP, 1 falta, caiu de nível): barra de progresso, contadores e histórico.

### 7. Denúncia enviada e revisada no painel admin · ~1 min
- Janela 2 (Enzo) → perfil de alguém → **Denunciar perfil** → motivo → **Enviar**.
- Entre como **admin** → **Admin** (cabeçalho) → aba **Denúncias** → **Confirmar (−30 XP)** → mostre o XP do denunciado.
- Aba **Locais**: aprove o **Café Meeple** e mostre que ele aparece no mapa.

## Pontos para falar na apresentação

- **Segurança no banco, não só na tela:** CPF e contato protegidos por RLS; XP calculado só por funções do banco (o usuário não consegue alterar o próprio XP).
- **Testes:** 105 testes automatizados (CPF, regras de XP, permissões) + testes de ponta a ponta das telas.
- **Custo zero:** Supabase, Vercel e OpenStreetMap em planos gratuitos.
