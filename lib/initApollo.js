import { ApolloClient, createNetworkInterface } from 'react-apollo'
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws'
import fetch from 'isomorphic-fetch'

const GRAPHQL_URL = 'http://localhost:3000/graphql'
const WS_URL = 'ws://localhost:3000/subscriptions'
let apolloClient

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

function create (initialState) {
  const ssrMode = !process.browser

  let networkInterface = createNetworkInterface({
    uri: GRAPHQL_URL,
    opts: {
      credentials: 'same-origin'
    }
  })

  if (!ssrMode) {
    const wsClient = new SubscriptionClient(WS_URL, {
      reconnect: true
    })

    networkInterface = addGraphQLSubscriptions(
      networkInterface,
      wsClient
    )
  }

  return new ApolloClient({
    initialState,
    ssrMode, // Disables forceFetch on the server (so queries are only run once)
    networkInterface
  })
}

export default function initApollo (initialState) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState)
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState)
  }

  return apolloClient
}
