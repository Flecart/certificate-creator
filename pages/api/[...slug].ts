import type { NextApiRequest, NextApiResponse } from 'next'

const NEW_BASE_URL = 'https://certificate-creator-steel.vercel.app'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
  
  // Set appropriate headers for the redirect
  res.setHeader('Location', newUrl)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  
  // Return 301 permanent redirect
  res.status(301).json({
    message: 'This API endpoint has been moved permanently',
    newUrl: newUrl,
    deprecated: true,
    originalPath: originalPath
  })
}