# Regras do Agente — Portal Hub Construtec

Launcher corporativo, cockpit de esteira e monitoramento de sistemas locais da Construtec Engenharia (Node.js nativo, HTML5, CSS3, Vanilla JS).

## Regras Universais

- **Sem emojis no frontend**:
  - Nenhuma tela, botão, aba, card de módulo, alerta, status ou cabeçalho deve conter emojis em texto.
  - Utilize exclusivamente ícones vetoriais SVG (padronizados com viewBox 24x24), badges de status e tipografia corporativa sóbria.
- **Harmonização Visual da Suíte**:
  - Paleta compatível com a Mesa Operacional: Deep Navy (`#122036`), Azul Construtec (`#085ce5` / `#0284c7`), Ciano (`#01b7f1`) e superfícies contrastadas.
  - Suporte completo aos modos claro e escuro sincronizados via LocalStorage.
- **Simplicidade & Performance**:
  - Manter o servidor `server.js` em Node.js puro, sem dependências npm externas pesadas.
  - Respeitar o limite de modularidade (`MAX_LINES <= 350` por arquivo).
