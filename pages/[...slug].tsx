import { GetServerSideProps } from 'next'

const NEW_BASE_URL = 'https://certificate-creator-steel.vercel.app'

export default function CatchAllPage() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, ...queryParams } = context.query
  
  // Reconstruct the original path
  const pathSegments = Array.isArray(slug) ? slug : [slug]
  const originalPath = `/${pathSegments.join('/')}`
  
  // Build query string from remaining parameters
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString()
  
  // Construct the new URL
  const newUrl = `${NEW_BASE_URL}${originalPath}${queryString ? `?${queryString}` : ''}`
  
  return {
    redirect: {
      destination: newUrl,
      permanent: true,
    },
  }
}
