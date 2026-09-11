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

O servidor web usa módulos nativos do Node.js; `npm install` só é necessário para o wrapper Electron e o empacotamento.

## Esteira e portas

| Etapa | Serviço | URL padrão | Estado |
|---|---|---|---|
| 01 | Construtec Orçamentos | `http://localhost:5173` | integrado ao monitor e launcher |
| 02 | Centro de Custos v3 | `http://localhost:3333` | integrado, com health-check e carteira |
| 03 | Chamados & O.S. | `http://localhost:3334` | em preparação |
| Hub | Portal | `http://127.0.0.1:3000` | ponto de entrada |

O Hub também detecta o fallback do Centro em `:3456`. As URLs locais podem ser ajustadas no modal “Configurar Portas Locais”.

## Carteira consolidada

Defina `CONSTRUTEC_INTEGRATION_KEY` no ambiente do processo do Hub com a mesma chave configurada no Centro de Custos. O Hub não carrega `.env` automaticamente. Sem a variável, o monitor e a esteira funcionam, mas a carteira fica indisponível.

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
