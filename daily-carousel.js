const dailyTrack = document.querySelector('#daily-track');
const dailyStatus = document.querySelector('#daily-status');
const dailyControls = document.querySelectorAll('[data-daily-scroll]');
const realPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brazilDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' });
let lastOffersDay;
let offersRetryAt = 0;
let offersLoading = false;

for (const button of dailyControls) {
  button.addEventListener('click', () => {
    dailyTrack.scrollBy({ left: Number(button.dataset.dailyScroll) * dailyTrack.clientWidth });
  });
}

function dailyCard(item) {
  const link = document.createElement('a');
  link.className = 'daily-card';
  link.href = shop(item.href);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const image = document.createElement('img');
  image.src = item.image;
  image.alt = '';
  image.loading = 'lazy';

  const name = document.createElement('strong');
  name.textContent = item.name;
  const prices = document.createElement('span');
  const original = document.createElement('s');
  original.textContent = realPrice.format(item.listPrice);
  const current = document.createElement('strong');
  current.textContent = realPrice.format(item.price);
  prices.append(original, ' ', current);

  const discount = document.createElement('span');
  const rounded = Math.floor(item.discount);
  discount.textContent = rounded > 50 ? rounded + '% OFF' : 'Mais de 50% OFF';
  link.append(image, name, prices, discount);
  return link;
}

async function renderDailyOffers() {
  const response = await fetch('/api/offers?section=daily', { cache: 'no-store' });
  if (!response.ok) throw new Error('Foxton indisponível');
  const { cards } = await response.json();
  dailyTrack.replaceChildren(...cards.map(dailyCard));
  dailyStatus.textContent = cards.length
    ? 'Preços da variante em oferta. Confira os tamanhos disponíveis na Foxton.'
    : 'Nenhuma oferta com mais de 50% de desconto foi encontrada hoje.';
  for (const button of dailyControls) button.hidden = cards.length < 2;
}

async function refreshOfferSections() {
  const today = brazilDate.format(Date.now());
  if (offersLoading || today === lastOffersDay || Date.now() < offersRetryAt) return;
  offersLoading = true;
  if (lastOffersDay && today !== lastOffersDay) {
    dailyTrack.replaceChildren();
    dailyStatus.textContent = 'Consultando as ofertas de hoje.';
    for (const button of dailyControls) button.hidden = true;
  }

  try {
    const results = await Promise.allSettled([offers(), renderDailyOffers()]);
    if (results[1].status === 'rejected') {
      dailyStatus.textContent = 'Ofertas indisponíveis agora. Consulte a página oficial da Foxton.';
    }
    if (results.every(result => result.status === 'fulfilled' && result.value !== false)) {
      lastOffersDay = today;
    } else {
      offersRetryAt = Date.now() + 60000;
    }
  } finally {
    offersLoading = false;
  }
}

refreshOfferSections();
setInterval(refreshOfferSections, 60000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshOfferSections();
});
