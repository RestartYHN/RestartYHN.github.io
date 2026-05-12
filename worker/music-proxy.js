export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL("https://api-enhanced-knbv.vercel.app");
    target.pathname = url.pathname;
    target.search = url.search;

    const proxyReq = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
    });

    const resp = await fetch(proxyReq);
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(resp.body, { status: resp.status, headers });
  },
};
