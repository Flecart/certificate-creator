import { GetServerSideProps } from 'next'

const NEW_BASE_URL = 'https://certificate-creator-steel.vercel.app'

export default function Home({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { ...queryParams } = context.query
    
    // Build query string from parameters
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString()
    
    // Construct the new URL
    const newUrl = `${NEW_BASE_URL}/${queryString ? `?${queryString}` : ''}`
    
    // Make the request to the new URL
    const response = await fetch(newUrl, {
      method: 'GET',
      headers: {
        'User-Agent': context.req.headers['user-agent'] || 'Proxy-Request',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    })
    
    if (!response.ok) {
      return {
        notFound: true,
      }
    }
    
    const html = await response.text()
    
    return {
      props: {
        html,
      },
    }
  } catch (error) {
    console.error('Proxy error:', error)
    return {
      notFound: true,
    }
  }
}
