import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <link rel="icon" href="/favicon.ico" />

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css"></link>
      </Head>
      <body className='min-h-screen'>
        <Main />
      </body>
      <NextScript />
    </Html>
  )
}