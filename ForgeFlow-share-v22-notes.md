# ForgeFlow Share V22

## Correção principal
- Corrigido problema em que o menu contextual não aparecia: ele estava sendo renderizado fora da modal, mas com z-index menor que o overlay principal do Share Studio.

## Melhorias
- Popover e barra flutuante agora ficam acima da modal (`z-index` máximo).
- Removido/limitado overflow horizontal da tela de compartilhamento.
- Proteções para não haver conteúdo cortado à direita no mobile.
- Popover tem largura máxima segura e rolagem interna quando necessário.
- Barra flutuante inferior agora usa `left/right` no mobile, evitando sair da viewport.

## Arquivos alterados
- src/styles/mobile-page-polish.css
