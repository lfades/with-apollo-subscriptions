import { makeExecutableSchema } from 'graphql-tools'
import { withFilter, PubSub } from 'graphql-subscriptions'

const pubsub = new PubSub()
const typeDefs = [`
  type Message {
    id: Int
    text: String
  }

  type Done {
    done: Boolean
  }

  type Query {
    messages: [Message]
  }

  type Mutation {
    addMessage: Done
  }

  type Subscription {
    messageAdded: Message
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`]
let nextMessage = 4

const resolvers = {
  Query: {
    messages: () => ([
      {id: 1, text: 'Message #1'},
      {id: 2, text: 'Message #2'},
      {id: 3, text: 'Message #3'}
    ])
  },
  Mutation: {
    addMessage () {
      console.log('addMessage mutation')

      const id = nextMessage++
      const message = {id, text: 'Message #' + id}

      pubsub.publish('messageAdded', {messageAdded: message})
      // don't return message here to let the subscription do the update
      return {done: true}
    }
  },
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => {
          console.log('subscribed!')
          return pubsub.asyncIterator('messageAdded')
        },
        (payload) => {
          console.log('new Message', payload)
          return true
        }
      )
    }
  }
}

export const schema = makeExecutableSchema({
  typeDefs, resolvers
})
