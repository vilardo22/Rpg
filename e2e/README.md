# Testes de ponta a ponta

Abrem um navegador de verdade (sem janela), entram com as contas de demonstração e fazem o caminho completo de cada fase: cadastro, missões, locais, conclusão e XP, denúncias, admin, avisos e home. Ao todo são mais de 100 checagens.

## Antes de rodar

- **Microsoft Edge** instalado (já vem no Windows). Para usar o Chrome: `E2E_BROWSER=chrome`.
- `.env.local` preenchido. Os testes **recriam os dados de demonstração** (`npm run seed`) no Supabase: apagam só as contas `@demo.quadro.dev` e os dados delas.
- O app rodando, se for testar localmente:
  ```bash
  npm run build && npm start   # http://localhost:3000
  ```

## Rodar

```bash
npm run e2e                                        # testa http://localhost:3000
npm run e2e -- https://rpg-nine-olive.vercel.app   # testa o site publicado
npm run e2e -- http://localhost:3000 fase2         # só um arquivo (nome contém "fase2")
```

Cada linha sai como `OK` ou `FALHA`, e no fim aparece um resumo por arquivo. As capturas de tela (390px) ficam em `e2e/capturas/`, pasta ignorada pelo git.

## Arquivos

| Arquivo | O que testa |
|---|---|
| `fase1-cadastro.mjs` | CPF inválido, máscara, menor de 18, CPF repetido, cadastro, sair, login com `?next=` |
| `fase2-missoes.mjs` | Criar missão, filtros, pedir entrada, aprovar, contato só para aprovados, lotação, cancelar |
| `fase3-locais.mjs` | Mapa com só locais verificados, balão do pino, página do local, local pendente escondido |
| `fase4-perfil-xp.mjs` | Concluir missão com falta, XP de cada um, histórico, "Criar a próxima", editar perfil, privacidade |
| `fase5-admin-avisos.mjs` | Denúncias, selo "Em análise", painel admin (locais, denúncias, usuários), avisos e contador |
| `fase6-home.mjs` | Home pública, prévia sem dados privados, redirecionamentos, "Pular para o conteúdo", 390px sem rolagem lateral |
