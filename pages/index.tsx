import { GetServerSideProps } from 'next'

const NEW_BASE_URL = 'https://certificate-creator-steel.vercel.app'

export default function Home() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { ...queryParams } = context.query
  
  // Build query string from parameters
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString()
  
  // Construct the new URL
  const newUrl = `${NEW_BASE_URL}/${queryString ? `?${queryString}` : ''}`
  
  return {
    redirect: {
      destination: newUrl,
      permanent: true,
    },
  }
}
