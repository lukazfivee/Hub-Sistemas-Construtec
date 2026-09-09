# Hub Sistemas Construtec

Portal local da suíte Construtec: launcher, monitor dos serviços e cockpit da carteira de obras.

## Executar no Windows

Instale Node.js 20 ou superior, clone este repositório e abra `start-hub.bat`.
Também é possível executar `npm start` e acessar http://127.0.0.1:3000.
O servidor web utiliza módulos nativos do Node.js e não precisa de `npm install` para iniciar.

## Integrações

- Centro de Custos: serviço separado na porta 3333 (fallback de demonstração: 3456).
- Orçamentos: projeto separado na pasta irmã `Construtec orçamentos/construtec-orcamentos`.
- Chamados e ordens de serviço: integração em preparação.
- Para consultar a carteira, configure `CONSTRUTEC_INTEGRATION_KEY` no ambiente do processo com a mesma chave configurada no Centro de Custos. O Hub não carrega `.env` automaticamente. Sem a variável, o monitor funciona e a carteira fica indisponível.

O repositório contém somente o Hub. Bancos, backups, credenciais e os outros sistemas não estão incluídos. O acesso HTTP fica restrito ao próprio computador.

O controle de encerramento local está em `lib/localControl.js`. Seus registros temporários ficam em `%LOCALAPPDATA%/Construtec/Suite/runtime` e não devem ser publicados.

## Estado desktop

O manifesto contém configuração de empacotamento Electron, mas os arquivos `desktop/` ainda não existem nesta versão. O caminho validado é o servidor web local; não há instalador desktop pronto neste repositório.
