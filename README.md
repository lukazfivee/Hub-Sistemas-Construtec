# Hub Sistemas Construtec

Shell local da suíte Construtec: launcher, monitor dos serviços e cockpit da carteira de obras. O Hub é o ponto de entrada; os módulos continuam repositórios independentes e podem ser executados juntos no mesmo computador.

## Pré-requisitos

- Windows 10/11
- Node.js 20 ou superior
- Repositórios irmãos quando for usar os módulos reais:
  - `Construtec orçamentos/construtec-orcamentos`
  - `centro de custos CONSTRUTEC`
  - `chamadopro` (opcional; etapa 03)

## Executar no Windows

```powershell
npm install
npm start
```

Abra `http://127.0.0.1:3000`. Para uso diário, abra `start-hub.bat`.

Para a janela desktop:

```powershell
npm run electron
```

No Electron, o botão de Orçamentos inicia o Vite local quando necessário e abre o módulo em uma janela da própria suíte. Links externos continuam abrindo no navegador padrão.

O servidor web usa módulos nativos do Node.js; `npm install` só é necessário para o wrapper Electron e o empacotamento.

## Esteira e portas

| Etapa | Serviço | URL padrão | Estado |
|---|---|---|---|
| 01 | Construtec Orçamentos | `http://localhost:5173` | integrado ao monitor e launcher |
| 02 | Centro de Custos v3 | `http://localhost:3456` | integrado na porta dedicada |
| 03 | Chamados & O.S. | `https://chamadopro-app.lucas-coelho5923.workers.dev` | integrado por API protegida |
| Hub | Portal local | `http://127.0.0.1:3000` | ponto de entrada desktop |

### Hub online

O portal também pode ser publicado como Worker em `https://hub-sistemas-construtec.<conta>.workers.dev`. A publicação usa `src/index.js` para servir `public/` e consultar o ChamadoPro sem enviar a chave ao navegador.

Configure o segredo do Worker online com o mesmo valor de `HUB_INTEGRATION_KEY` do ChamadoPro:

```powershell
npx wrangler secret put HUB_INTEGRATION_KEY
npx wrangler deploy
```

No modo online, Orçamentos e Centro de Custos continuam identificados como módulos locais; o ChamadoPro é a integração remota operante.

As URLs locais podem ser ajustadas no modal “Configurar Portas Locais”.

## Carteira consolidada

Defina `CONSTRUTEC_INTEGRATION_KEY` no ambiente do processo do Hub com a mesma chave configurada no Centro de Custos. O Hub não carrega `.env` automaticamente. Sem a variável, o monitor e a esteira funcionam, mas a carteira fica indisponível.

Para o ChamadoPro, defina `CONSTRUTEC_CHAMADOS_INTEGRATION_KEY` no ambiente do Hub com o mesmo valor do segredo `HUB_INTEGRATION_KEY` configurado no Worker. O Hub consulta o health-check público e, com a chave, os endpoints protegidos de resumo e chamados recentes. A chave nunca é enviada ao navegador nem salva no `localStorage`.

Exemplo no PowerShell:

```powershell
$env:CONSTRUTEC_CHAMADOS_INTEGRATION_KEY = 'mesma-chave-do-segredo-HUB_INTEGRATION_KEY'
npm start
```

Durante o desenvolvimento, a Etapa 03 também pode apontar para um serviço local em `localhost:3334`. O endereço oficial e os endereços locais permitidos são validados pelo Hub.

Nunca publique chaves, bancos, backups, logs ou arquivos `.env`.

## Estrutura

- `server.js`: servidor HTTP, health-check, status da esteira e launcher de Orçamentos.
- `public/index.html`: shell visual do Hub.
- `public/hub-config.js`: estado, metadados e validação de URLs locais.
- `public/hub-status.js`: polling dos serviços e atualização dos badges.
- `public/hub-settings.js`: configuração persistente de portas.
- `public/hub-portfolio.js`: cockpit consolidado de obras.
- `desktop/main.js` e `desktop/preload.js`: wrapper Electron seguro.
- `lib/localControl.js`: encerramento autenticado e local; registros ficam em `%LOCALAPPDATA%/Construtec/Suite/runtime`.
- `test/`: testes HTTP e de arquivos estáticos.

## Testes

```powershell
npm test
```

O teste HTTP espera o Hub disponível em `127.0.0.1:3000`; para uma checagem rápida, execute `npm start` em outro terminal antes de rodar os testes.

Para validar o clone e os repositórios irmãos em um único comando (com o Hub já iniciado):

```powershell
npm run validate
```

Use `npm run validate -- -RequireModules` quando os três módulos irmãos forem obrigatórios na máquina.

## Colaboração

1. Crie uma branch a partir de `main`.
2. Não comite `node_modules`, `dist`, `graphify-out`, logs, bancos ou credenciais.
3. Rode `npm test` antes do pull request.
4. Explique no PR quais portas e repositórios irmãos foram usados na validação.

O repositório contém o Hub e seus assets. Os outros sistemas permanecem em seus próprios repositórios para permitir desenvolvimento independente.
