# ATC Controle EPI

Aplicativo móvel Android em Expo + React Native + TypeScript + Expo Router para controle de colaboradores, EPIs, entregas, trocas, compras, movimentações e estoque.

## Perfis demonstrativos

- **Administrador:** usuário `admin` • PIN `0000`
- **Funcionário:** matrícula `000123` • PIN `1234`

> O login deste MVP é **local** e serve para demonstrar separação de perfis. Os PINs e dados ficam no dispositivo via AsyncStorage. Para uso corporativo real, substitua por autenticação segura e backend autorizado.

## Permissões

### Administrador
Acesso geral: dashboard, colaboradores, estoque, entregas, trocas, compras, relatórios PDF/CSV, alertas e configurações.

### Funcionário
Acesso limitado: painel pessoal, própria ficha, próprios EPIs, histórico associado, alertas pessoais e criação/acompanhamento de solicitações de troca. Não vê compras, custos globais, cadastro geral de pessoas ou inventário administrativo.

## Funcionalidades implementadas

- Navegação inferior: Início, Pessoas/Meu perfil, Estoque/Meus EPIs, Trocas e Mais.
- Busca global no dashboard.
- CRUD de colaboradores para ADM.
- Cadastro e catálogo de EPIs com busca e filtros por categoria, status e criticidade.
- Estados de estoque: Normal, Estoque baixo e Sem estoque.
- Entrega de EPI com validação de saldo, baixa de estoque, movimentação de saída e histórico do colaborador.
- Trocas com estados Pendente, Em análise, Aprovada, Reprovada, Aguardando estoque e Concluída.
- Conclusão de troca condicionada ao estoque e geração automática de saída/entrega.
- Compras com fornecedor, CNPJ, nota fiscal, item, quantidade, valor unitário, total e anexo do dispositivo.
- Entrada automática de estoque e movimentação de compra.
- Alertas de baixo estoque, ruptura, CA próximo do vencimento e trocas pendentes.
- PDF consolidado em paisagem com indicadores, quatro gráficos e tabela detalhada de estoque.
- Exportação CSV do estoque.
- Persistência local via AsyncStorage.
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

## Gerar APK pelo celular

Este repositório inclui um workflow do GitHub Actions que gera um APK instalável sem precisar de computador.

1. Abra a aba **Actions** do repositório.
2. Abra **Android APK**.
3. Toque em **Run workflow** e confirme a branch `main`.
4. Ao concluir, abra a execução e baixe o artefato **ATC-Controle-EPI-APK**.
5. Extraia o ZIP do artefato e instale `ATC-Controle-EPI.apk` no Android.

O workflow também roda automaticamente quando há alterações na branch `main`.

> O APK gerado por GitHub Actions usa build `debug`, adequado para testes internos. Para distribuição corporativa/Play Store, use um build Android assinado de release.
