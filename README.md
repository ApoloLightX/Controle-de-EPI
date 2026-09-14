# ATC Controle EPI

Aplicativo móvel Android em Expo + React Native + TypeScript + Expo Router para controle de colaboradores, EPIs, entregas, trocas, compras, movimentações e estoque.

## Perfis demonstrativos

- **Administrador:** usuário `admin` • PIN `0000`
- **Funcionário:** matrícula `000123` • PIN `1234`

> O login deste MVP é **local** e serve para demonstrar separação de perfis. Os PINs e dados ficam no dispositivo via AsyncStorage. Para uso corporativo real, substitua por autenticação segura e backend autorizado. A tela de login não exibe nem preenche essas credenciais automaticamente.

## Permissões

### Administrador
Acesso geral: dashboard, colaboradores, estoque, entregas, trocas, compras, relatórios PDF/CSV, alertas e configurações.

### Funcionário
Acesso limitado: painel pessoal, própria ficha, próprios EPIs, histórico associado, alertas pessoais e criação/acompanhamento de solicitações de troca. Não vê compras, custos globais, cadastro geral de pessoas ou inventário administrativo.

## Funcionalidades implementadas

- Navegação inferior: Início, Pessoas/Meu perfil, Estoque/Meus EPIs, Trocas e Mais.
- Busca global no dashboard.
- CRUD de colaboradores para ADM, com preservação de registros que possuem histórico.
- Cadastro e catálogo de EPIs com busca e filtros por categoria, status e criticidade.
- Estados de estoque: Normal, Estoque baixo e Sem estoque.
- Entrega de EPI com validação de saldo, baixa de estoque, movimentação de saída e histórico do colaborador.
- Trocas com estados Pendente, Em análise, Aprovada, Reprovada, Aguardando estoque e Concluída.
- Conclusão de troca condicionada ao estoque e geração automática de saída/entrega.
- Compras com fornecedor, CNPJ, nota fiscal, itens, quantidade, valor unitário, total e anexo persistente no dispositivo.
- Entrada automática de estoque e movimentação de compra.
- Alertas de baixo estoque, ruptura, CA próximo do vencimento e trocas pendentes.
- PDF consolidado em paisagem com indicadores, quatro gráficos e tabela detalhada de estoque.
- Exportações CSV com neutralização de conteúdo interpretável como fórmula por planilhas.
- Persistência local via AsyncStorage, mantendo as chaves de dados v1.
- Dados demonstrativos visivelmente identificados e restauráveis.
- Ícone quadrado exclusivo, splash, favicon e ícone adaptativo Android.

## Relatório PDF

O botão **Exportar PDF** gera um relatório local com colaboradores ativos, EPIs cadastrados, saldo total em estoque, itens abaixo do mínimo, gastos, quatro gráficos e tabela detalhada do estoque.

## Como executar

```bash
npm install
npx expo install --fix
npm run check
npx expo start --android
```

## Validação

```bash
npm run typecheck
npm run lint
npm test
# ou tudo junto
npm run check
```

## Gerar APK Android Release standalone

O repositório inclui o workflow **Android APK**. Antes de compilar, ele executa TypeScript, ESLint e testes. Na branch `main`, ou por execução manual, o pipeline faz `expo prebuild`, incrementa o `versionCode` e compila `assembleRelease`, gerando `ATC-Controle-EPI.apk` com o JavaScript de produção embutido.

1. Abra a aba **Actions** do repositório.
2. Abra **Android APK**.
3. Toque em **Run workflow** e selecione a branch desejada quando a execução manual estiver disponível.
4. A build só prossegue se a chave Android conhecida estiver disponível.
5. Ao concluir, baixe o artefato **ATC-Controle-EPI-APK** e instale `ATC-Controle-EPI.apk`.

### Compatibilidade de atualização

O package permanece `com.atc.controleepi`. Para atualizar uma instalação existente, o novo APK precisa usar **a mesma chave de assinatura Android** da versão já instalada e um `versionCode` maior.

O workflow não cria mais uma chave nova automaticamente quando a assinatura conhecida está ausente. Ele restaura `~/.android/debug.keystore` do cache legado ou, preferencialmente, usa o secret `ATC_ANDROID_KEYSTORE_BASE64` contendo exatamente a mesma chave usada nas builds anteriores. Se nenhuma cópia válida estiver disponível, a build falha para evitar produzir um APK incompatível com atualização.

> Guarde uma cópia permanente e segura do keystore já usado. Cache de CI não deve ser a única cópia de uma chave de assinatura.

## Auditoria técnica

A auditoria de arquitetura, UX, acessibilidade, permissões, persistência, estoque, entregas, trocas, compras, relatórios, autenticação, performance, testes e preparação de Release de 14/09/2026 está em [`docs/AUDITORIA_2026-09-14.md`](docs/AUDITORIA_2026-09-14.md).
