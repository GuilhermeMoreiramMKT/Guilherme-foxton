import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFoxtonSearchUrl,normalizeSearchSelection} from '../search.js';

test('exemplo do cliente preserva categorias e tamanhos como quatro facets repetidas',()=>{
 const url=new URL(buildFoxtonSearchUrl({categories:['bermudas-e-shorts','camisas'],sizes:['m','40']}));
 assert.equal(url.origin,'https://www.foxtonbrasil.com.br');assert.equal(url.pathname,'/roupas');
 assert.deepEqual(url.searchParams.getAll('facets'),['category-2/bermudas-e-shorts','category-2/camisas','tamanho/m','tamanho/40']);
 assert.equal(url.searchParams.get('page'),'1');assert.equal(url.searchParams.get('utm_campaign'),'A6NJ');
});
test('permite categorias ou tamanhos isolados e busca sem filtros',()=>{
 assert.deepEqual(new URL(buildFoxtonSearchUrl({sizes:['40']})).searchParams.getAll('facets'),['tamanho/40']);
 assert.deepEqual(new URL(buildFoxtonSearchUrl({categories:['camisas']})).searchParams.getAll('facets'),['category-2/camisas']);
 assert.deepEqual(new URL(buildFoxtonSearchUrl()).searchParams.getAll('facets'),[]);
});
test('remove duplicatas e valores não suportados sem alterar destino',()=>{
 const selected=normalizeSearchSelection({categories:['camisas','camisas','https://evil.example'],sizes:['m','m','999']});assert.deepEqual(selected.categories,['camisas']);assert.deepEqual(selected.sizes,['m']);assert.deepEqual(selected.fabrics,[]);assert.deepEqual(selected.colors,[]);
});
test('formulário nativo gera os mesmos filtros e funciona sem JavaScript',()=>{
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const form=html.match(/<form id="search-form"[\s\S]*?<\/form>/)?.[0];assert(form);assert(form.includes('method="get"'));assert(form.includes('action="https://www.foxtonbrasil.com.br/roupas"'));
 const chosen=new Set(['category-2/bermudas-e-shorts','category-2/camisas','tamanho/m','tamanho/40']);
 const native=new URLSearchParams();
 for(const input of form.matchAll(/<input\b[^>]*>/g)){
  const attr=Object.fromEntries([...input[0].matchAll(/([a-z-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  if(/\bdisabled(?:>|\s)/.test(input[0])||!attr.name)continue;
  if(attr.type==='hidden'||chosen.has(attr.value)||(attr.type==='radio'&&/\bchecked(?:>|\s)/.test(input[0])))native.append(attr.name,attr.value);
 }
 const built=new URL(buildFoxtonSearchUrl({categories:['bermudas-e-shorts','camisas'],sizes:['m','40']})).searchParams;
 assert.deepEqual([...native].sort(),[...built].sort());
 assert(!html.includes('SEARCH_DASHBOARD'));assert(!html.includes('SEARCH_CATEGORY_OPTIONS'));
});

 test('tecido, cor, preço e ordenação usam as chaves oficiais sem perder os demais filtros',()=>{
 const url=new URL(buildFoxtonSearchUrl({categories:['camisas'],sizes:['m'],fabrics:['linho'],colors:['verde'],price:{min:100,max:1000},sort:'price:asc'}));
 assert.deepEqual(url.searchParams.getAll('facets'),['category-2/camisas','materia-prima/linho','cores-filtraveis/verde','tamanho/m','price/100:1000']);assert.equal(url.searchParams.get('sort'),'price:asc');
 });
 test('valida os dois limites de preço e completa o limite não informado',()=>{
 assert.equal(new URL(buildFoxtonSearchUrl({price:{min:'',max:300}})).searchParams.getAll('facets')[0],'price/52.2:300');
 for(const price of [{min:400,max:200},{min:-1,max:100},{min:200,max:99999},{min:'nope',max:500}])assert.throws(()=>buildFoxtonSearchUrl({price}),RangeError);
 });
 test('catálogo contém todos os grupos e opções atuais consultados na Foxton',()=>{
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const key of ['category-2','materia-prima','cores-filtraveis','tamanho','price','sort'])assert(html.includes('data-filter-key="'+key+'"'));
 for(const value of ['materia-prima/algodao-pima','materia-prima/linho','materia-prima/tecnico','tamanho/50','tamanho/xxxg','category-2/intimos','cores-filtraveis/off-white'])assert(html.includes('value="'+value+'"'));
 const menu=html.match(/<details class="filter-menu"[^>]*>/)[0];assert(!menu.includes(' open'));
 });
