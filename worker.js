export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Contact form API route — handled by this same worker
    if (url.pathname === '/api/contact') {
      // Pass through to assets (handled client-side via Web3Forms)
      return new Response('Not Found', { status: 404 });
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  }
};
