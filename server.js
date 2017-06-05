import express from 'express'
import next from 'next'
import { createServer } from 'http'
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import bodyParser from 'body-parser'
import { execute, subscribe } from 'graphql'
import { schema } from './schema'

const dev = process.env.NODE_ENV !== 'production'
const app = next({dev})
const handle = app.getRequestHandler()

const graphqlPath = '/graphql'
const graphiqlPath = '/graphiql'
const graphqlOptions = {schema}
const subscriptionsPath = '/subscriptions'

const graphiqlOptions = {
  endpointURL: graphqlPath,
  subscriptionsEndpoint: 'ws://localhost:3000' + subscriptionsPath
}

app.prepare()
.then(() => {
  const server = express()
  const httpServer = createServer(server)

  server.use(graphqlPath, bodyParser.json(), graphqlExpress(req => {
    const query = req.query.query || req.body.query
    if (query && query.length > 2000) {
      throw new Error('Query too large.')
    }

    return {...graphqlOptions}
  }))

  server.use(graphiqlPath, graphiqlExpress(graphiqlOptions))

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  httpServer.listen(3000, '0.0.0.0', (err) => {
    if (err) throw err
    console.log('> ready on localhost:3000')
  })

  new SubscriptionServer(
    {
      schema,
      execute,
      subscribe,
      onDisconnect () {
        console.log('Client disconnected')
      }
    },
    {server: httpServer, path: subscriptionsPath}
  )
})
