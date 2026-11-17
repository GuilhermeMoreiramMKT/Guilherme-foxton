const store = 'https://www.foxtonbrasil.com.br';
const dailyUrl = new URL('/foxton-friday/oferta-do-dia', store);
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
let snapshot;
let pending;

export function brazilDay(time) {
  return dateFormat.format(time);
}

function parsePage(html) {
  const cards = [];
  let foundCatalog = false;

  for (const [, raw] of html.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/g)) {
    let payload;
    try { [, payload] = JSON.parse(raw); } catch { continue; }
    if (typeof payload !== 'string' || !payload.includes('"products"')) continue;

    for (const line of payload.split('\n')) {
      if (!line.includes('"products"')) continue;
      let record;
      try { record = JSON.parse(line.slice(line.indexOf(':') + 1)); } catch { continue; }
      const products = record?.[3]?.children?.[1]?.[3]?.data?.products;
      if (!Array.isArray(products)) continue;
      foundCatalog = true;

      for (const { node } of products) {
        const image = node?.image?.find(({url}) => /^https:\/\/(?:foxton\.vtexassets\.com|foxton\.vteximg\.com\.br)\//.test(url))?.url;
        if (!image || !node.name || !/^[a-z0-9-]+(?:\/p)?$/i.test(node.slug)) continue;

        const prices = [];
        for (const offer of node.offers?.offers ?? []) {
          const { listPrice, price, availability } = offer;
          if (availability !== true || !Number.isFinite(listPrice) || !Number.isFinite(price) || price <= 0 || listPrice <= price * 2) continue;
          prices.push({ listPrice, price, discount: (1 - price / listPrice) * 100 });
        }

        prices.sort((a, b) => b.discount - a.discount || a.price - b.price);
        if (prices.length) {
          const slug = node.slug.replace(/\/p$/, '');
          cards.push({ name: node.name, image, href: new URL('/' + slug + '/p', store).href, ...prices[0] });
        }
      }
    }
  }

  if (!foundCatalog) throw new Error('Foxton daily catalog unavailable');
  return cards;
}

async function readPage(url) {
  const response = await fetch(url, {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Foxton HTTP ' + response.status);
  return response.text();
}

async function refresh() {
  const firstPage = await readPage(dailyUrl);
  const cards = parsePage(firstPage);
  const pageUrls = new Map();

  for (const [, href] of firstPage.matchAll(/href="([^"]*oferta-do-dia\?[^"]*)"/g)) {
    const url = new URL(href.replaceAll('&amp;', '&'), store);
    const page = Number(url.searchParams.get('page'));
    if (url.origin === dailyUrl.origin && url.pathname === dailyUrl.pathname && Number.isInteger(page) && page > 1) {
      pageUrls.set(page, url);
    }
  }

  const urls = [...pageUrls].sort(([a], [b]) => a - b).slice(0, 11);
  const pages = await Promise.all(urls.map(async ([, url]) => parsePage(await readPage(url))));
  const unique = new Map();
  for (const card of [...cards, ...pages.flat()]) {
    if (!unique.has(card.href) || unique.get(card.href).discount < card.discount) unique.set(card.href, card);
  }

  return {
    cards: [...unique.values()].sort((a, b) => b.discount - a.discount || a.price - b.price).slice(0, 12),
    checkedAt: new Date().toISOString()
  };
}

export async function loadDailyOffers() {
  const day = brazilDay(Date.now());
  if (snapshot?.day === day && Date.now() < snapshot.expiresAt) return snapshot.data;
  if (pending?.day === day) return pending.promise;

  const promise = refresh().then(data => {
    if (brazilDay(Date.now()) === day) snapshot = { day, data, expiresAt: Date.now() + 3600000 };
    return data;
  }).finally(() => {
    if (pending?.promise === promise) pending = undefined;
  });
  pending = { day, promise };
  return promise;
}
