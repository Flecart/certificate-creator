import type { NextApiRequest, NextApiResponse } from 'next'

const NEW_BASE_URL = 'https://certificate-creator-steel.vercel.app'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the slug array from the catch-all route
    const { slug } = req.query
    
    // Reconstruct the original path
    const pathSegments = Array.isArray(slug) ? slug : [slug]
    const originalPath = `/api/${pathSegments.join('/')}`
    
    // Get query parameters (excluding the slug)
    const queryParams = { ...req.query }
    delete queryParams.slug
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString()
    
    // Construct the new URL
    const newUrl = `${NEW_BASE_URL}${originalPath}${queryString ? `?${queryString}` : ''}`
    
    // Prepare headers for the proxy request
    const proxyHeaders: Record<string, string> = {
      'Content-Type': Array.isArray(req.headers['content-type']) 
        ? req.headers['content-type'][0] 
        : req.headers['content-type'] || 'application/json',
      'User-Agent': Array.isArray(req.headers['user-agent']) 
        ? req.headers['user-agent'][0] 
        : req.headers['user-agent'] || 'Proxy-Request',
    }
    
    // Copy relevant headers from the original request
    if (req.headers.authorization) {
      proxyHeaders['Authorization'] = Array.isArray(req.headers.authorization) 
        ? req.headers.authorization[0] 
        : req.headers.authorization
    }
    if (req.headers['x-api-key']) {
      proxyHeaders['x-api-key'] = Array.isArray(req.headers['x-api-key']) 
        ? req.headers['x-api-key'][0] 
        : req.headers['x-api-key']
    }
    
    // Prepare the request body
    let body: string | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    }
    
    // Make the request to the new URL
    const response = await fetch(newUrl, {
      method: req.method,
      headers: proxyHeaders,
      body: body,
    })
    
    // Get the response data
    const responseData = await response.text()
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value)
      }
    })
    
    // Set status and send response
    res.status(response.status).send(responseData)
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({
      error: 'Internal server error while proxying request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}