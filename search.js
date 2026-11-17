import {FILTER_GROUPS,PRICE_LIMITS,SEARCH_SORTS} from './filter-catalog.js';
export const SEARCH_CATEGORIES=FILTER_GROUPS.find(g=>g.property==='categories').options;
export const SEARCH_SIZES=FILTER_GROUPS.find(g=>g.property==='sizes').options.map(o=>o.value);
export function normalizeSearchSelection(selection={}){
 const normalized={};
 FILTER_GROUPS.forEach(group=>{const wanted=new Set(selection[group.property]||[]);normalized[group.property]=group.options.filter(o=>wanted.has(o.value)).map(o=>o.value)});
 normalized.sort=SEARCH_SORTS.some(o=>o.value===selection.sort)?selection.sort:'score:desc';
 normalized.price=null;
 if(selection.price&&(selection.price.min!==''&&selection.price.min!=null||selection.price.max!==''&&selection.price.max!=null)){
  const min=selection.price.min==null||selection.price.min===''?PRICE_LIMITS.min:Number(selection.price.min);
  const max=selection.price.max==null||selection.price.max===''?PRICE_LIMITS.max:Number(selection.price.max);
  if(!Number.isFinite(min)||!Number.isFinite(max)||min<PRICE_LIMITS.min||max>PRICE_LIMITS.max||min>max)throw new RangeError('Confira a faixa de preço: o valor mínimo deve ser menor ou igual ao máximo.');
  normalized.price={min:Math.round(min*100)/100,max:Math.round(max*100)/100};
 }
 return normalized;
}
export function buildFoxtonSearchUrl(selection={}){
 const selected=normalizeSearchSelection(selection);const url=new URL(selection.scope==='flash'?'https://www.foxtonbrasil.com.br/flash-sale':'https://www.foxtonbrasil.com.br/roupas');
 url.searchParams.set('sort',selected.sort);url.searchParams.set('count','12');url.searchParams.set('page','1');
 FILTER_GROUPS.forEach(group=>selected[group.property].forEach(value=>url.searchParams.append('facets',group.key+'/'+value)));
 if(selected.price)url.searchParams.append('facets','price/'+selected.price.min+':'+selected.price.max);
 url.searchParams.set('utm_source','guilherme_moreira');url.searchParams.set('utm_medium','curadoria');url.searchParams.set('utm_campaign','A6NJ');
 return url.href;
}
