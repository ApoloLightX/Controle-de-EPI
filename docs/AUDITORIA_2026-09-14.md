# Auditoria técnica — ATC Controle EPI

Data: 14/09/2026

Branch de correção: `audit/hardening-2026-09-14`

## Premissas preservadas

- Expo Router e estrutura de rotas existente.
- TypeScript estrito.
- AsyncStorage e as chaves `@atc-controle-epi:data:v1` e `@atc-controle-epi:session:v1`.
- Formato atual de `AppData`, sem migração destrutiva.
- Package Android `com.atc.controleepi`.
- Identidade visual, cores e navegação principal.
- Compatibilidade de atualização Android: a assinatura existente não pode ser rotacionada silenciosamente.

## Resultado executivo

A base é adequada para um MVP local/offline, com separação visual de perfis, regras básicas de estoque e relatórios úteis. Ela ainda não deve ser tratada como autenticação corporativa forte ou como sistema de registro imutável/compliance, porque credenciais e dados permanecem no dispositivo e não existe backend autorizado.

A auditoria corrigiu falhas que podiam quebrar histórico, permitir transições inválidas, perder anexos, produzir datas incorretas e gerar uma build Android incompatível com a instalada. Mudanças que exigiriam novo modelo de dados ou recuperação de credenciais foram mantidas como pendências explícitas.

## Criticidade alta

### P0 — autenticação local não é segurança corporativa — PENDENTE

- O administrador continua usando credencial local fixa por compatibilidade com instalações existentes.
- PINs de funcionários continuam fazendo parte dos dados locais persistidos.
- A sessão é local e não existe servidor para revogação, auditoria ou autorização independente do dispositivo.
- A tela deixou de exibir/preencher automaticamente as credenciais, mas isso reduz apenas exposição visual; não transforma o mecanismo em autenticação forte.

**Recomendação:** antes de uso corporativo com dados sensíveis, projetar migração de credenciais com recuperação de acesso, armazenamento seguro e backend/autorização. Não trocar a credencial atual silenciosamente em uma atualização.

### P0 — assinatura Android e compatibilidade de atualização — CORRIGIDO NO PIPELINE

O workflow anterior podia gerar um novo `debug.keystore` quando o cache estivesse ausente. Um APK assinado por essa nova chave não atualizaria o app já instalado.

O pipeline agora:

- restaura a chave conhecida do cache;
- aceita `ATC_ANDROID_KEYSTORE_BASE64` como fonte persistente da MESMA chave;
- aborta a build se a chave conhecida estiver indisponível;
- nunca cria silenciosamente uma nova chave durante uma atualização;
- mantém `assembleRelease` e JavaScript embutido para APK standalone.

**Ação operacional:** preservar a chave que assinou as instalações existentes e armazenar uma cópia segura fora do cache do GitHub Actions.

## Integridade de dados e regras — corrigido

- Exclusão de colaborador agora é bloqueada quando há entregas ou trocas vinculadas, evitando histórico órfão.
- Matrícula de funcionário passa a ser única; data de admissão e PIN são validados.
- O seletor de status do funcionário deixou de ser um campo de texto que voltava para `Ativo` durante a digitação.
- Sessões de funcionário persistidas são revalidadas no carregamento; funcionário inexistente/inativo não mantém sessão válida após reinício.
- Leitura de AsyncStorage passou a tolerar JSON inválido e dados v1 sem `movements`.
- Escritas são serializadas e usam a referência mais recente dos dados, reduzindo sobrescritas por snapshots antigos.
- `updateEpi` não pode alterar `stock` nem `lastPurchase` por fora das operações de estoque.
- Entrega exige ADM, funcionário ativo, motivo válido, quantidade inteira positiva e saldo suficiente.
- Compra exige ADM, itens existentes, quantidades/valores válidos e calcula total em centavos para reduzir erro de ponto flutuante.
- Ações de troca agora respeitam transições de estado; solicitações encerradas não podem ser reprocessadas.
- Funcionário só pode criar troca para si e apenas de EPI previamente entregue. A exceção anterior que permitia ao ADM escolher qualquer EPI quando não havia histórico foi removida.
- Datas de registros usam a data civil local em vez de `toISOString().slice(0, 10)`, evitando avançar o dia no Brasil durante a noite.
- Datas de CA usam validação civil real; datas como `2026-02-31` são rejeitadas.
- O indicador de trocas deixou de usar a data fixa `2026-08-21` e passou a usar janela móvel de 30 dias.

## Persistência e anexos — corrigido parcialmente

Novos anexos de compras e fotos de trocas são copiados para o diretório persistente do aplicativo. Antes, a URI apontava para o cache temporário e podia desaparecer.

- Documentos de compra agora podem ser abertos/compartilhados pela listagem.
- Fotos de troca agora são exibidas na solicitação.
- URIs antigas foram preservadas sem migração; se o arquivo antigo de cache já tiver sido removido pelo Android, não há bytes que possam ser recuperados.

## Relatórios PDF/CSV

### PDF

O gerador já escapava conteúdo inserido no HTML e continua restrito ao ADM pela interface. O relatório é local e compartilhado pelo sistema.

Limitação mantida: “custo por colaborador” é estimado usando o valor unitário atual do EPI, pois a entrega não armazena custo histórico. O próprio PDF identifica esse valor como estimativa.

### CSV

Foi adicionada neutralização de células textuais iniciadas por `=`, `+`, `-` ou `@`, evitando que conteúdo cadastrado seja interpretado como fórmula por Excel/planilhas ao abrir o CSV.

## Acessibilidade e UX — melhorado

- Campos base recebem `accessibilityLabel` derivado do rótulo visível.
- Busca, botões, atalhos, filtros e seletores principais expõem papéis/estados acessíveis.
- Botões informam estado desabilitado/carregando.
- Cabeçalhos e estados vazios possuem semântica melhor.
- Login não preenche nem exibe credenciais automaticamente.
- Acesso direto ao grupo de abas sem sessão redireciona ao login.

Ainda é recomendável fazer teste manual com TalkBack, tamanho de fonte elevado e contraste no aparelho-alvo.

## Funcionalidades incompletas que NÃO foram inventadas nesta auditoria

### P1 — estoque sem ajuste/inventário físico

Existe o tipo de movimento `Ajuste`, usado no estoque inicial, mas não há fluxo administrativo para inventário físico, acerto de divergência, perda, avaria ou baixa manual. Implementar corretamente exige definir motivo, responsável e política de auditoria.

### P1 — troca não registra devolução/descarte do EPI antigo

A conclusão da troca registra a nova entrega e a saída de estoque, mas o modelo não possui uma entidade de devolução, descarte, condição do item devolvido ou saldo de itens em posse. Por isso, somar entregas representa histórico de recebimento, não necessariamente “EPIs atualmente em uso”.

### P1 — aprovação de troca não reserva estoque

Uma troca aprovada não bloqueia unidades para aquela solicitação. Entregas posteriores podem consumir o saldo antes da conclusão. Da mesma forma, múltiplas trocas aguardando estoque podem ficar “Aprovadas” após uma compra se cada uma, isoladamente, couber no saldo. A conclusão ainda impede estoque negativo, mas o status pode superestimar a disponibilidade.

Definir se aprovação deve significar “reserva” é uma decisão de negócio; não foi introduzida reserva retroativa nesta auditoria.

### P1 — sem backup/restauração integral

PDF/CSV são relatórios, não backup completo restaurável. AsyncStorage local é um ponto único de persistência. Para operação real, deve existir exportação/importação versionada ou backend.

### P1 — CA informado manualmente

O sistema alerta sobre a validade cadastrada, mas não consulta fonte oficial nem comprova que o CA pertence ao produto. Qualquer integração externa deve ser definida separadamente.

## Performance

Para o volume de um MVP local, a arquitetura é simples e aceitável. Pontos de escala:

- `AppContext` concentra todo o `AppData`; qualquer alteração relevante atualiza consumidores do contexto.
- Telas usam `ScrollView` e `map`, não listas virtualizadas; centenas/milhares de registros podem degradar memória e rolagem.
- Relatórios fazem várias buscas lineares (`find`/`filter`) e podem se tornar O(n²) em bases grandes.
- AsyncStorage serializa o conjunto completo de dados em cada commit.

**Prioridade:** P2 enquanto a base permanecer pequena; migrar para seletores/contextos menores, `FlatList`, índices em memória e persistência transacional se o volume crescer.

## Testes

A suíte unitária foi ampliada para cobrir:

- saldo e baixa de estoque;
- cálculo de compras e entradas inválidas;
- quantidade e transições de troca;
- datas/alertas de CA;
- PIN;
- janela móvel de 30 dias;
- data civil local.

Lacunas ainda existentes:

- testes de integração do `AppContext` com AsyncStorage;
- testes de navegação/autorização de rotas;
- testes dos geradores PDF/CSV;
- testes de falha de armazenamento/arquivo;
- E2E Android dos fluxos ADM e Funcionário.

## Build Android Release standalone

O projeto mantém `com.atc.controleepi`, Expo Router e `assembleRelease`. O workflow executa primeiro `npm run check`, faz `expo prebuild --platform android --clean`, incrementa `versionCode` pelo número da execução e compila `app-release.apk` com JavaScript de produção embutido.

A build de Release só deve prosseguir quando a mesma chave Android usada na versão instalada estiver disponível. Isso é requisito de atualização, não uma otimização.

## Ordem recomendada para a próxima etapa

1. **P0:** definir autenticação corporativa e estratégia de migração/recuperação.
2. **P0:** guardar permanentemente a chave Android existente e documentar fingerprint SHA-256.
3. **P1:** definir estoque reservado em trocas e concorrência entre entrega/troca.
4. **P1:** modelar devolução/descarte/posse atual e ajuste de inventário com trilha de auditoria.
5. **P1:** criar backup/restauração versionados ou backend.
6. **P2:** testes de integração/E2E e otimização para volumes maiores.
