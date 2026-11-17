// Progressive enhancement: all content remains readable without animation support.
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const editorialEase='cubic-bezier(.22,1,.36,1)';
let revealObserver;
function animateReveal(el,delay=0){
 el.classList.remove('motion-pending');el.classList.add('is-revealed');
 if(motionPreference.matches||!el.animate)return;
 const image=el.classList.contains('look')||el.classList.contains('offer');
 el.animate([{opacity:0,transform:'translate3d(0,'+(image?40:24)+'px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:image?1000:850,delay,easing:editorialEase,fill:'backwards'});
}
function revealContent(container){
 if(!revealObserver||!container)return;
 container.querySelectorAll('.offer,.offer-error').forEach((el,i)=>{el.dataset.motionDelay=String(i*100);el.classList.add('motion-pending');revealObserver.observe(el)});
}
if(!motionPreference.matches&&'IntersectionObserver' in window&&Element.prototype.animate){
 document.documentElement.classList.add('motion-enabled');
 // The title enters line by line, with a subtle image zoom as a counterpoint.
 document.querySelectorAll('h1>.line,h1>em').forEach((el,i)=>{
  const mask=document.createElement('span');mask.className='title-mask';el.before(mask);mask.append(el);
  el.animate([{transform:'translateY(110%)',opacity:.3},{transform:'translateY(0)',opacity:1}],{duration:1150,delay:130+i*140,easing:editorialEase,fill:'backwards'});
 });
 ['.hero-copy>.eyebrow','.hero-copy>p','.hero-actions','.hero-foot','.hero-card'].forEach((selector,i)=>{const el=document.querySelector(selector);if(el)animateReveal(el,180+i*125)});
 document.querySelector('.hero-image>img')?.animate([{scale:'1.09',opacity:0},{scale:'1',opacity:1}],{duration:1600,easing:editorialEase,fill:'backwards'});
 document.querySelector('header')?.animate([{opacity:0,transform:'translateY(-12px)'},{opacity:1,transform:'translateY(0)'}],{duration:800,easing:editorialEase});
 revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(!entry.isIntersecting)return;animateReveal(entry.target,Number(entry.target.dataset.motionDelay||0));revealObserver.unobserve(entry.target)});
 },{threshold:.1,rootMargin:'0px 0px -18px 0px'});
 document.querySelectorAll('.search-dashboard,.search-under-note,.value,.section-top>*,.tabs,.look,.curator-note,.offer-note,.method>div:first-child,.step,.about-portrait,.about>div:last-child,.faq>.eyebrow,.faq>h2,.faq-card,.contact>*,.footer-row,.legal').forEach(el=>{
  const siblings=[...el.parentElement.children].filter(s=>s.matches('.value,.look,.step,.faq-card'));
  el.dataset.motionDelay=String(Math.min(Math.max(siblings.indexOf(el),0)*90,270));el.classList.add('motion-pending');revealObserver.observe(el);
 });
 revealContent(document.querySelector('#offers'));
}
// Filtering feels like a new selection, rather than an abrupt layout replacement.
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('.look:not([hidden])').forEach((el,i)=>{revealObserver?.unobserve(el);animateReveal(el,i*85)});
}));
// One expanded FAQ at a time; interruptions reverse from the current height.
const faqAnimations=new WeakMap();
function setFaq(card,expanded){
 const startHeight=card.getBoundingClientRect().height;
 const previous=faqAnimations.get(card);if(previous){previous.onfinish=null;previous.cancel()}
 card.dataset.expanded=String(expanded);card.querySelector('summary').setAttribute('aria-expanded',String(expanded));
 if(motionPreference.matches||!card.animate){card.open=expanded;card.style.height='';return}
 card.open=true;card.style.height='auto';
 const endHeight=expanded?card.getBoundingClientRect().height:card.querySelector('summary').getBoundingClientRect().height+2;
 card.style.height=startHeight+'px';
 const animation=card.animate([{height:startHeight+'px'},{height:endHeight+'px'}],{duration:460,easing:editorialEase});
 faqAnimations.set(card,animation);
 animation.onfinish=()=>{card.open=expanded;card.style.height='';faqAnimations.delete(card)};
 if(expanded)card.querySelector('.faq-answer').animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,delay:70,easing:editorialEase,fill:'backwards'});
}
document.querySelectorAll('.faq-card').forEach(card=>{
 card.querySelector('summary').setAttribute('aria-expanded',String(card.open));
 card.querySelector('summary').addEventListener('click',event=>{
  event.preventDefault();const expanded=card.dataset.expanded?card.dataset.expanded!=='true':!card.open;
  if(expanded)document.querySelectorAll('.faq-card').forEach(other=>{if(other!==card&&(other.dataset.expanded==='true'||(other.open&&other.dataset.expanded!=='false')))setFaq(other,false)});
  setFaq(card,expanded);
 });
});
// A single animation frame per scroll event updates only transforms.
const headerElement=document.querySelector('header');const heroElement=document.querySelector('.hero-image');let scrollFrame=0;
function paintScroll(){
 scrollFrame=0;const max=document.documentElement.scrollHeight-innerHeight;
 headerElement.style.setProperty('--scroll-progress',String(max>0?Math.min(1,Math.max(0,scrollY/max)):0));headerElement.classList.toggle('is-scrolled',scrollY>20);
 if(heroElement&&!motionPreference.matches){const rect=heroElement.getBoundingClientRect();if(rect.bottom>0&&rect.top<innerHeight){const limit=innerWidth<761?10:16;const shift=Math.max(-limit,Math.min(limit,(innerHeight*.4-rect.top-rect.height*.25)*.045));heroElement.style.setProperty('--hero-shift',shift+'px')}}
}
function queueScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll)}
addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',queueScroll,{passive:true});paintScroll();
motionPreference.addEventListener('change',()=>{
 if(motionPreference.matches){revealObserver?.disconnect();document.querySelectorAll('.motion-pending').forEach(el=>el.classList.remove('motion-pending'));document.querySelectorAll('.faq-card').forEach(card=>{const a=faqAnimations.get(card);if(a)a.finish()});document.getAnimations().forEach(a=>{if(a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity)a.finish()});document.documentElement.classList.remove('motion-enabled');heroElement?.style.removeProperty('--hero-shift')}
});
