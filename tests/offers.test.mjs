import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker,{extractOffers} from '../worker.js';
const fixture=fs.readFileSync(new URL('./fixtures/offers.html',import.meta.url),'utf8');
test('ofertas funcionam sem o cache padrão, com concorrência, expiração e recuperação',async()=>{
 const originalFetch=globalThis.fetch;const originalNow=Date.now;const descriptor=Object.getOwnPropertyDescriptor(globalThis,'caches');
 let now=originalNow(),calls=0,failed=false;
 Object.defineProperty(globalThis,'caches',{configurable:true,get(){throw Error('default cache forbidden')}});
 Date.now=()=>now;
 globalThis.fetch=async()=>{calls++;if(failed)throw Error('source unavailable');return new Response(fixture)};
 const req=()=>new Request('https://example.test/api/offers');
 try{
  const results=await Promise.all([worker.fetch(req()),worker.fetch(req())]);
  assert(results.every(r=>r.status===200));assert.equal(calls,1);
  const data=await results[0].json();assert.equal(data.cards.length,3);
  assert(data.cards.every(c=>c.image.startsWith('https://foxton.vtexassets.com/')&&c.href.startsWith('https://www.foxtonbrasil.com.br/')));
  assert(!Number.isNaN(Date.parse(data.checkedAt)));
  await worker.fetch(req());assert.equal(calls,1);
  now+=3600001;failed=true;
  const error=await worker.fetch(req());assert.equal(error.status,503);assert.equal(error.headers.get('Cache-Control'),'no-store');
  failed=false;assert.equal((await worker.fetch(req())).status,200);assert.equal(calls,3);
  assert.equal(extractOffers('<a href="https://evil.example/oferta-falsa"><img src="https://foxton.vtexassets.com/offer.png"></a>').length,0);
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow;if(descriptor)Object.defineProperty(globalThis,'caches',descriptor);else delete globalThis.caches}
});
