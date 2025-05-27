addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const allowedOrigins = [
  'https://cfdns-5nj.pages.dev',
  // Add other allowed origins if needed
]

async function handleRequest(request) {
  const origin = request.headers.get('Origin')
  
  // Handle OPTIONS requests (preflight)
  if (request.method === 'OPTIONS') {
    return handleOptions(request, origin)
  }

  // Check if origin is allowed
  if (!allowedOrigins.includes(origin)) {
    return new Response('Not allowed', { status: 403 })
  }

  try {
    // Extract the path from the request
    const url = new URL(request.url)
    const apiPath = url.pathname.replace('/proxy/', '')
    
    // Forward the request to Cloudflare API
    const apiUrl = `https://api.cloudflare.com/client/v4/${apiPath}${url.search}`
    
    const headers = new Headers(request.headers)
    headers.set('Authorization', request.headers.get('Authorization') || '')
    
    // Make the request to Cloudflare API
    const response = await fetch(apiUrl, {
      method: request.method,
      headers: headers,
      body: request.method === 'GET' ? undefined : request.body
    })
    
    // Add CORS headers to the response
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin 
      }
    })
  }
}

function handleOptions(request, origin) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  })
  }
