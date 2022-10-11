import '@styles/globals.css'
import 'animate.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Link from 'next/link'

export const Links = {
  App: {
    home: '/',
    blockchainGraph: '/blockchain-graph',
  },
  API: {
    post: {
      addnewnode: '/api/post/addnewnode',
    }
  }
}

function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />
      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta httpEquiv="X-UA-Compatible" content="IE=7" />

      <meta name="description" content="" />
      <meta name="keywords" content="" />
    </Head>
    <nav className="relative flex flex-wrap items-center justify-between px-2 py-3 bg-gray-800 mb-3">
      <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
        <div className="w-full relative flex justify-between lg:w-auto  px-4 lg:static lg:block lg:justify-start">
          <Link href={Links.App.home}>
            <a className="text-xl font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase text-white" >
              Internal System
            </a>
          </Link>
          {/* <button className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none" type="button">
            <span className="block relative w-6 h-px rounded-sm bg-white"></span>
            <span className="block relative w-6 h-px rounded-sm bg-white mt-1"></span>
            <span className="block relative w-6 h-px rounded-sm bg-white mt-1"></span>
          </button> */}
        </div>

        <div className="flex items-center">
          <Link href={Links.App.home}>
            <a className="">Home</a>
          </Link>
        </div>

        <div className="flex flex-grow items-center">
          <ul className="flex flex-row list-none ml-auto">
            <li>
              <Link href='/node/add'>
                <a className="px-3 py-2 flex items-center font-mono leading-snug text-white hover:opacity-75">
                  <i className="mb-0 bi bi-plus-square" />
                  <span className="ml-2">Add</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href='/node/edit'>
                <a className="px-3 py-2 flex items-center font-mono leading-snug text-white hover:opacity-75">
                  <i className="mb-0 bi bi-pencil-square" />
                  <span className="ml-2">Edit</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href='/node/verify'>
                <a className="px-3 py-2 flex items-center font-mono leading-snug text-white hover:opacity-75">
                  <i className="mb-0 bi bi-patch-check" />
                  <span className="ml-2">Verify</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <Component {...pageProps} />
  </>
}

export default App
