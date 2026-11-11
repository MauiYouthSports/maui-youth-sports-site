import { handleScore } from './score-submit.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev')) {
      const target = new URL(url.pathname + url.search, 'https://mauiyouthsports.com');
      return Response.redirect(target.toString(), 301);
    }
    if (url.pathname === '/api/score') {
      if (request.method === 'POST') return handleScore(request, env);
      return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
    }
    return env.ASSETS.fetch(request);
  }
};
