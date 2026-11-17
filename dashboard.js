const searchForm=document.querySelector('#search-form');
const filterMenu=document.querySelector('#filter-menu');
const minPrice=document.querySelector('#min-price');const maxPrice=document.querySelector('#max-price');
const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function rawSearchSelection(){
 const selection=Object.fromEntries(FILTER_GROUPS.map(g=>[g.property,[]]));
 searchForm.querySelectorAll('input[name="facets"]:checked').forEach(input=>{const [key,value]=input.value.split('/');const group=FILTER_GROUPS.find(g=>g.key===key);if(group)selection[group.property].push(value)});
 selection.sort=searchForm.querySelector('input[name="sort"]:checked')?.value||'score:desc';
 selection.price={min:minPrice.value,max:maxPrice.value};return selection;
}
function currentSearchSelection(){return normalizeSearchSelection(rawSearchSelection())}
function closeFilterMenu(){filterMenu.open=false;document.querySelector('#filter-trigger').focus()}
function updateSearchSummary(){
 maxPrice.setCustomValidity('');document.querySelector('#price-error').textContent='';
 const raw=rawSearchSelection();let selection;
 try{selection=normalizeSearchSelection(raw)}catch(error){maxPrice.setCustomValidity(error.message);document.querySelector('#price-error').textContent=error.message;selection=normalizeSearchSelection({...raw,price:null})}
 const priceField=document.querySelector('#price-facet');priceField.disabled=!selection.price;priceField.value=selection.price?'price/'+selection.price.min+':'+selection.price.max:'';
 const entries=[];
 FILTER_GROUPS.forEach(group=>{
  selection[group.property].forEach(value=>entries.push({key:group.key,value,label:(group.property==='sizes'?'Tam. ':'')+group.options.find(o=>o.value===value).label}));
  const count=selection[group.property].length;document.querySelector('[data-group-count="'+group.key+'"]').textContent=count?count+' selecionado'+(count>1?'s':''):'';
 });
 if(selection.price)entries.push({key:'price',label:money(selection.price.min)+' — '+money(selection.price.max)});
 if(selection.sort!=='score:desc')entries.push({key:'sort',label:SEARCH_SORTS.find(s=>s.value===selection.sort).label});
 document.querySelector('[data-group-count="price"]').textContent=selection.price?'Definida':'';document.querySelector('[data-group-count="sort"]').textContent=SEARCH_SORTS.find(s=>s.value===selection.sort).label;
 const total=entries.length;document.querySelector('#search-count').textContent=total+' filtro'+(total!==1?'s':'')+' selecionado'+(total!==1?'s':'');
 const badge=document.querySelector('#filter-trigger-count');badge.hidden=!total;badge.textContent=String(total);
 document.querySelector('#search-announcement').textContent=total+' filtro'+(total!==1?'s':'')+' na sua seleção.';
 const summary=document.querySelector('#search-selection');summary.replaceChildren();
 if(!total){const span=document.createElement('span');span.className='summary-empty';span.textContent='Abra “Filtrar” e selecione suas preferências.';summary.append(span)}
 entries.forEach(entry=>{
  const chip=document.createElement('button');chip.type='button';chip.className='selection-chip';chip.setAttribute('aria-label','Remover filtro: '+entry.label);
  const label=document.createElement('span');label.textContent=entry.label;chip.append(label);
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 12 12');icon.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m3 3 6 6M9 3 3 9');icon.append(path);chip.append(icon);
  chip.onclick=()=>{
   if(entry.key==='price'){minPrice.value='';maxPrice.value=''}
   else if(entry.key==='sort')searchForm.querySelector('input[name="sort"][value="score:desc"]').checked=true;
   else{const input=[...searchForm.querySelectorAll('input[name="facets"]')].find(i=>i.value===entry.key+'/'+entry.value);if(input)input.checked=false}
   updateSearchSummary();document.querySelector('#filter-trigger').focus();
  };summary.append(chip);
 });
 document.querySelector('#search-submit-label').textContent=total?'Ver seleção na Foxton':'Ver roupas na Foxton';searchForm.querySelector('[type="reset"]').disabled=!total&&!(minPrice.value||maxPrice.value);
}
searchForm.addEventListener('change',updateSearchSummary);minPrice.addEventListener('input',updateSearchSummary);maxPrice.addEventListener('input',updateSearchSummary);
searchForm.addEventListener('reset',()=>requestAnimationFrame(updateSearchSummary));
searchForm.addEventListener('invalid',event=>{filterMenu.open=true;const group=event.target.closest('.filter-group');if(group)group.open=true},true);
searchForm.addEventListener('submit',event=>{
 try{const destination=new URL(buildFoxtonSearchUrl(currentSearchSelection()));searchForm.action=destination.origin+destination.pathname}
 catch{event.preventDefault();filterMenu.open=true;searchForm.querySelector('[data-filter-key="price"]').open=true;maxPrice.focus()}
});
document.querySelector('#filter-close').onclick=closeFilterMenu;document.querySelector('#filter-done').onclick=()=>{if(!minPrice.checkValidity()||!maxPrice.checkValidity()){searchForm.querySelector('[data-filter-key="price"]').open=true;searchForm.reportValidity();return}closeFilterMenu()};
document.addEventListener('pointerdown',event=>{if(filterMenu.open&&!filterMenu.contains(event.target))filterMenu.open=false});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&filterMenu.open){event.preventDefault();closeFilterMenu()}});
filterMenu.addEventListener('toggle',()=>{
 document.querySelector('#filter-trigger').setAttribute('aria-expanded',String(filterMenu.open));
 if(filterMenu.open&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const panel=filterMenu.querySelector('.filter-dropdown');panel.animate?.([{opacity:0,transform:'translateY(-7px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'})}
});
searchForm.querySelectorAll('.filter-group').forEach(group=>group.addEventListener('toggle',()=>{
 if(!group.open||group.hasAttribute('data-wizard-choices'))return;
 searchForm.querySelectorAll('.filter-group').forEach(other=>{if(other!==group&&!other.hasAttribute('data-wizard-choices'))other.open=false});
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)group.querySelector('.filter-options').animate?.([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
}));
updateSearchSummary();

const wizard=document.querySelector('#search-wizard');
const wizardSteps=Object.fromEntries([...wizard.querySelectorAll('[data-step]')].map(panel=>[panel.dataset.step,panel]));
let scopeBack='welcome';
function showSearchStep(step){
 Object.values(wizardSteps).forEach(panel=>{panel.hidden=panel!==wizardSteps[step]});
 wizardSteps[step].querySelector('legend').focus();
}
for(const [step,keys] of Object.entries({pieces:['category-2'],sizes:['tamanho'],details:['materia-prima','cores-filtraveis','price','sort']})){
 for(const key of keys){
  const group=searchForm.querySelector('[data-filter-key="'+key+'"]');
  if(step==='details')wizardSteps[step].querySelector('[data-options]').append(group);
  else {
   group.dataset.wizardChoices='';
   wizardSteps[step].querySelector('[data-options]').append(group);
   group.open=true;
  }
 }
}
searchForm.classList.add('guided-search');
searchForm.querySelector('.search-card-intro p').textContent='Responda algumas perguntas e abra sua seleção no site oficial da Foxton.';
wizard.hidden=false;
wizard.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button)return;
 const {next,skip,scope}=button.dataset;
 const step=button.closest('[data-step]').dataset.step;
 if(skip==='details'){
  wizardSteps.details.querySelectorAll('input[type="checkbox"]').forEach(input=>{input.checked=false});
  minPrice.value='';maxPrice.value='';
  wizardSteps.details.querySelector('input[value="score:desc"]').checked=true;
 }else if(skip){
  wizard.querySelectorAll('[data-group="'+skip+'"] input').forEach(input=>{input.checked=false});
 }
 if(skip)updateSearchSummary();
 if(next==='scope'&&step!=='result'){
  if(step==='welcome')searchForm.reset();
  if(step==='details'&&(!minPrice.checkValidity()||!maxPrice.checkValidity())){
   minPrice.closest('details').open=true;
   searchForm.reportValidity();
   return;
  }
  scopeBack=step;
 }
 if(next)showSearchStep(next);
 if('back' in button.dataset)showSearchStep(scopeBack);
 if('restart' in button.dataset){searchForm.reset();showSearchStep('welcome')}
 if(scope){
  const selection=currentSearchSelection();
  document.querySelector('#wizard-link').href=buildFoxtonSearchUrl({...selection,scope});
  const labels=[...document.querySelectorAll('#search-selection .selection-chip span')].map(label=>label.textContent);
  document.querySelector('#wizard-summary').textContent=[scope==='flash'?'Flash Sale':'Todas as peças',...labels].join(' · ');
  showSearchStep('result');
 }
});
searchForm.addEventListener('submit',event=>{if(!wizard.hidden)event.preventDefault()});
