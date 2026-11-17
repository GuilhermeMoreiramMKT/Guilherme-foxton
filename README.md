# Guilherme Moreira — curadoria de moda

Site responsivo em português, com Cloudflare Worker ESM sem dependências.

## Compilar

Execute `node build.mjs`. O código fonte da página está em `page.html`; a seleção editorial está em `looks.json`; a integração de ofertas está em `worker.js`.

## Conteúdo e atendimento

WhatsApp: +55 48 98815-1276. Código do vendedor: A6NJ. Os links incluem UTMs para identificar a origem da navegação. O código de vendedor deve ser informado pelo comprador no campo correspondente da Foxton; nenhum parâmetro de atribuição não documentado foi inventado. As fotos dos looks mostram modelos da Foxton; a seção Sobre mim exibe o retrato pessoal fornecido por Guilherme Moreira.

## Ofertas

`GET /api/offers` consulta a página pública inicial da Foxton e reproduz até três cards cujo link contém `oferta-`. Preserva imagens e destinos, restringe os domínios aceitos e não cria preços ou descontos. O cache em memória do processo e o cache HTTP expiram em até uma hora. A hospedagem não permite a API caches.default; o serviço não depende dela. Novos processos podem consultar a fonte antes desse prazo. A primeira visita após expirar atualiza os dados, inclusive em dias diferentes; não depende de uma tarefa manual diária nem de uma nova publicação. Não há rotina agendada enquanto o site está sem visitantes. Se a fonte falhar ou mudar, a página oferece acesso à Foxton sem exibir ofertas antigas como atuais.

## Validação

Verificados: sintaxe do Worker e do JavaScript da página, extração dos três cards reais da fonte, rejeição de domínios externos, respostas HTTP, erro da fonte e cache. QA visual em navegador não executado: runtime `cua_repl.js` indisponível neste ambiente. Os helpers locais do plugin Sites também não estão instalados; fonte sincronizada com Git e pacote tar equivalente criado a partir do mesmo commit.

## Refinamento visual e benefícios

Código A6NJ: até 15% de desconto e frete grátis em peças selecionadas, conforme informado pelo proprietário. As condições vigentes são confirmadas na Foxton. Todas as setas de navegação são SVG com stroke currentColor.

`motion.css` e `motion.js` implementam título por linhas, revelação por IntersectionObserver, paralaxe limitado na foto principal, progresso de leitura, interações e FAQ em cards com altura animada e expansão exclusiva. A preferência de movimento reduzido desativa os efeitos. O build injeta os dois arquivos no HTML e no Worker, sem dependências externas de animação.

Validação desta revisão: sintaxe da página e do Worker, substituição completa das setas, benefício corrigido, estrutura dos cards e simulação do FAQ (abrir, fechar, exclusividade, interrupção de animação e movimento reduzido). QA visual em navegador continua indisponível por ausência de cua_repl.js.

## Correção de carregamento em produção

Identificado HTTP 500 em `/api/offers`: o ambiente Sites bloqueia acesso ao cache padrão do Worker. Substituído por cache em memória com prazo de uma hora, deduplicação de consultas simultâneas e cache HTTP. Falhas da fonte retornam 503 sem impedir a página. O caminho de carregamento foi verificado no serviço publicado.

## Painel Minha seleção

A seção `#busca` oferece filtros múltiplos de categorias e tamanhos. O formulário GET nativo abre `/roupas` no site oficial da Foxton em nova aba e envia cada seleção como um parâmetro `facets` separado. Funciona sem JavaScript; com JavaScript, exibe resumo em tempo real, chips removíveis, contagem e botão de limpar. Os filtros não exigem conta e não são armazenados.

Categorias verificadas na configuração pública da página `/roupas`: bermudas-e-shorts, camisas, camisetas, polos, calcas e casacos-e-jaquetas, com a chave `category-2`. Tamanhos usam `tamanho/m`, `tamanho/40` etc. Os tamanhos selecionados se aplicam ao conjunto da busca, como alternativas, sem criar pares obrigatórios por categoria.

O exemplo bermudas + camisas + M + 40 foi consultado na Foxton: as quatro facets aparecem no estado da página retornada e os produtos têm categorias Camisas e Bermudas e Shorts. `tests/search.test.mjs` cobre o exemplo, busca parcial, busca vazia, normalização e equivalência entre envio nativo e URL gerada.

## Menu suspenso completo de filtros

O painel foi substituído por um card compacto com `details#filter-menu` inicialmente recolhido. Cada grupo abre suas opções por disclosure nativo; com JavaScript, apenas um grupo permanece expandido. O menu fecha ao concluir, clicar fora ou pressionar Escape. As seleções ficam em uma linha de chips com rolagem horizontal, evitando aumentar a altura do card.

Catálogo atual verificado no endpoint público usado pela Foxton: `https://foxton.myvtex.com/_v/proxy/search/facets?selectedFacets=productclusterids%2F167&sort=score%3Adesc&base=roupas&page=1&count=12`, com a origem pública `https://server-request-foxton.myvtex.com` utilizada pela implementação da própria loja. As chaves dos grupos foram verificadas também na configuração pública do menu de filtros da Foxton. `filter-catalog.js` contém a fotografia das opções consultadas nesta revisão: 10 categorias, 15 tecidos, 15 cores, 16 tamanhos, faixa de preço entre R$ 52,20 e R$ 5.498,00 e 7 ordenações. Não há consulta periódica das opções de filtros; atualizar o catálogo neste arquivo se a loja alterar sua taxonomia.

A faixa de preço usa `facets=price/min:max`, aceita um único limite e valida mínimos, máximos e ordem. Os demais grupos usam as chaves `category-2`, `materia-prima`, `cores-filtraveis` e `tamanho`. A seleção múltipla repete `facets`. O parâmetro `sort` mantém a sintaxe oficial. Sem JavaScript, os disclosures, os checkboxes e a ordenação continuam disponíveis; a faixa de preço exige JavaScript para compor o valor da facet.

Validado: 7 testes de busca, regressão do serviço de ofertas, sintaxe do build, regressões de FAQ e consulta HTTP 200 da Foxton confirmando, no estado retornado, camisas + linho + verde + M + preço 100:1000 com ordenação price:asc. Inspeção visual em navegador permanece indisponível neste ambiente.

## Retrato pessoal

A foto fornecida pelo proprietário está em `assets/guilherme-moreira-v1.jpg`, preservada sem edições. O build incorpora os bytes ao Worker, que atende `/assets/guilherme-moreira-v1.jpg` como image/jpeg com cache versionado. A seção Sobre mim substitui o monograma pelo retrato com legenda e enquadramento via object-fit/object-position em desktop e celular. Verificados HTTP 200, igualdade dos bytes com o original, resposta HEAD e referência no HTML. Inspeção visual no navegador permanece indisponível.
