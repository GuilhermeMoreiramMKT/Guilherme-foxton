import { brazilDay, loadDailyOffers } from './daily-offers.js';
// Cache local ao processo: compatível com Sites, sem acesso a caches.default.
const OFFER_TTL_MS=60*60*1000;
let offerSnapshot=null;
let offerRequest=null;
function offerResponse(data){return Response.json(data,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
async function loadOffers(){
 if(offerSnapshot&&Date.now()-offerSnapshot.loadedAt<OFFER_TTL_MS&&brazilDay(Date.now())===brazilDay(offerSnapshot.loadedAt))return offerSnapshot.data;
 if(offerRequest)return offerRequest;
 offerRequest=(async()=>{
  const res=await fetch('https://www.foxtonbrasil.com.br/',{headers:{'Accept':'text/html'},signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw new Error('source HTTP '+res.status);
  const cards=extractOffers(await res.text());if(!cards.length)throw new Error('source cards unavailable');
  const data={cards,checkedAt:new Date().toISOString()};offerSnapshot={data,loadedAt:Date.now()};return data;
 })();
 try{return await offerRequest}finally{offerRequest=null}
}
export function extractOffers(html){
 const cards=[];const seen=new Set();
 const anchors=html.matchAll(/<a\b[^>]*href="([^"]*oferta-[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);
 for(const match of anchors){
  let url;try{url=new URL(match[1].replaceAll('&amp;','&'),'https://www.foxtonbrasil.com.br')}catch{continue}
  if(url.hostname!=='www.foxtonbrasil.com.br'||seen.has(url.pathname))continue;
  const image=match[2].match(/<img\b[^>]*?\bsrc="([^"]+)"/i)?.[1];
  if(!image)continue;let parsed;try{parsed=new URL(image)}catch{continue}
  if(parsed.protocol!=='https:'||!['foxton.vtexassets.com','foxton.vteximg.com.br'].includes(parsed.hostname))continue;
  seen.add(url.pathname);cards.push({href:url.href,image:parsed.href,alt:'Oferta publicada no site oficial da Foxton'});if(cards.length===3)break;
 }
 return cards;
}
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Método não permitido',{status:405});
 if(url.pathname==='/assets/guilherme-moreira-v1.jpg'){
  const bytes=request.method==='HEAD'?null:Uint8Array.from(atob(PORTRAIT_BASE64),c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 }
 if(url.pathname==='/api/offers'){
  try{return offerResponse(await (url.searchParams.get('section')==='daily'?loadDailyOffers():loadOffers()))}
  catch(error){console.error('offers_source_failure',error.message);return Response.json({error:'Ofertas temporariamente indisponíveis'},{status:503,headers:{'Cache-Control':'no-store'}})}
 }
 if(url.pathname==='/robots.txt')return new Response('User-agent: *\nAllow: /\nDisallow: /api/');
 if(url.pathname!=='/'&&url.pathname!=='/index.html')return new Response('Página não encontrada',{status:404});
 return new Response(request.method==='HEAD'?null:PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com"}});
}};
