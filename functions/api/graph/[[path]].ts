import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Extract the path after /api/graph/
    const url = new URL(context.request.url);
    const graphPath = url.pathname.replace('/api/graph/', '');
    const queryString = url.search;
    
    const graphUrl = `https://graph.microsoft.com/v1.0/${graphPath}${queryString}`;

    // Forward the request to Microsoft Graph API
    const response = await fetch(graphUrl, {
      method: context.request.method,
      headers: {
        'Authorization': context.request.headers.get('Authorization') || '',
        'Content-Type': context.request.headers.get('Content-Type') || 'application/json',
      },
      body: context.request.method !== 'GET' ? await context.request.text() : undefined,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
