import { ReactElement } from 'react'
import { gql, useQuery } from '@apollo/client'
import { useWallet } from '@solana/wallet-adapter-react'
import { NextPage, NextPageContext } from 'next'
import { PublicKey } from '@solana/web3.js'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { equals, length, map, pipe, prop, when, isNil, always } from 'ramda'
import Link from 'next/link'
import client from '../../client'
import cx from 'classnames'
import { BasicLayout, NavigationLink } from './../../layouts/Basic'
import { truncateAddress, addressAvatar } from '../../modules/address'
import { Marketplace } from '../../types'

const SUBDOMAIN = process.env.MARKETPLACE_SUBDOMAIN

const GET_CREATORS_PREVIEW = gql`
  query GetCretorsPreview($subdomain: String!) {
    marketplace(subdomain: $subdomain) {
      subdomain
      ownerAddress
      creators {
        creatorAddress
        storeConfigAddress
        twitterHandle
        nftCount
        preview {
          address
          image
        }
        profile {
          handle
          profileImageUrl
        }
      }
    }
  }
`

export async function getServerSideProps({ req }: NextPageContext) {
  const subdomain = req?.headers['x-holaplex-subdomain'] || SUBDOMAIN

  const response = await client.query<GetMarketplace>({
    fetchPolicy: 'no-cache',
    query: gql`
      query GetMarketplacePage($subdomain: String!) {
        marketplace(subdomain: $subdomain) {
          subdomain
          name
          logoUrl
          bannerUrl
          description
          creators {
            creatorAddress
            storeConfigAddress
          }
          auctionHouse {
            authority
          }
        }
      }
    `,
    variables: {
      subdomain,
    },
  })

  const {
    data: { marketplace },
  } = response

  if (isNil(marketplace)) {
    return {
      notFound: true,
    }
  }

  if (pipe(length, equals(1))(marketplace.creators)) {
    return {
      redirect: {
        permanent: false,
        destination: `/creators/${marketplace.creators[0].creatorAddress}`,
      },
    }
  }

  return {
    props: {
      marketplace,
    },
  }
}

interface GetMarketplace {
  marketplace: Marketplace | null
}

interface GetCreatorPreviews {
  marketplace: Marketplace
}

interface CreatorsPageProps extends AppProps {
  marketplace: Marketplace
}

const Creators: NextPage<CreatorsPageProps> = ({ marketplace }) => {
  const { publicKey, connected } = useWallet()
  const creators = map(prop('creatorAddress'))(marketplace.creators)

  const creatorsQuery = useQuery<GetCreatorPreviews>(GET_CREATORS_PREVIEW, {
    variables: {
      subdomain: marketplace.subdomain,
    },
  })

  const loading = creatorsQuery.loading

  return (
    <>
      <Head>
        <title>{`${marketplace.name} Creators`}</title>
        <link rel="icon" href={marketplace.logoUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={marketplace.name} />
        <meta property="og:title" content={`${marketplace.name} Creators`} />
        <meta property="og:image" content={marketplace.bannerUrl} />
        <meta property="og:description" content={marketplace.description} />
      </Head>
      <div className="mt-20 mb-20">
        <h2>{`${marketplace.name} Creators`}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-8 md:gap-10 lg:gap-14 gap-y-14 mb-20">
        {loading ? (
          <>
            <div className="flex flex-col">
              <div className="bg-gray-800 rounded-full w-16 h-16 mb-7" />
              <div className="flex flex-grid mb-2 gap-4">
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="bg-gray-800 rounded-full w-16 h-16 mb-7" />
              <div className="flex flex-grid mb-2 gap-4">
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="bg-gray-800 rounded-full w-16 h-16 mb-7" />
              <div className="flex flex-grid mb-2 gap-4">
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="bg-gray-800 rounded-full w-16 h-16 mb-7" />
              <div className="flex flex-grid mb-2 gap-4">
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
                <div className="bg-gray-800 w-1/3 aspect-square" />
              </div>
            </div>
          </>
        ) : (
          creatorsQuery.data?.marketplace.creators.map((creator) => {
            return (
              <Link
                key={creator.creatorAddress}
                href={`/creators/${creator.creatorAddress}`}
                passHref
              >
                <a className="transition-transform hover:scale-[1.02] flex flex-col">
                  <div className="flex items-center mb-7">
                    <img
                      src={
                        when(
                          isNil,
                          always(
                            addressAvatar(new PublicKey(creator.creatorAddress))
                          )
                        )(creator.profile?.profileImageUrl) as string
                      }
                      className="object-cover bg-gray-900 rounded-full w-16 h-16 user-avatar"
                    />
                    <div className="flex flex-col ml-3 gap-2">
                      <div>
                        {creator.twitterHandle ? (
                          <span className="font-medium">{`@${creator.twitterHandle}`}</span>
                        ) : (
                          <span className="pubkey">
                            {truncateAddress(creator.creatorAddress)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-sm">NFTs</span>
                        <span className="text-sm">{creator.nftCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 mb-2 gap-4 overflow-hidden">
                    {creator.preview.map((nft, index) => {
                      return (
                        <div className="w-full" key={nft.address}>
                          <img
                            className={cx(
                              'w-full object-cover aspect-square rounded-md',
                              {
                                'hidden md:block':
                                  index === creator.preview.length - 1,
                              }
                            )}
                            src={nft.image}
                            alt={nft.name}
                          />
                        </div>
                      )
                    })}
                  </div>
                </a>
              </Link>
            )
          })
        )}
      </div>
    </>
  )
}

interface CreatorsLayoutProps {
  marketplace: Marketplace
  children: ReactElement
}

Creators.getLayout = ({ marketplace, children }: CreatorsLayoutProps) => {
  return (
    <BasicLayout active={NavigationLink.Creators} marketplace={marketplace}>
      {children}
    </BasicLayout>
  )
}

export default Creators
