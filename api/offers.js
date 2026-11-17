import worker from '../worker.js';

export default async function handler(request, response) {
  const result = await worker.fetch(
    new Request(new URL(request.url, 'https://localhost'), { method: request.method })
  );

  response.statusCode = result.status;
  for (const [name, value] of result.headers) {
    response.setHeader(name, value);
  }
  response.end(request.method === 'HEAD' ? undefined : await result.text());
}
