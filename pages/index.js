import React from 'react'
import withData from '../lib/withData'
import { shape, bool, object, arrayOf, func } from 'prop-types'
import { gql, graphql, compose } from 'react-apollo'

class Home extends React.Component {
  static propTypes = {
    data: shape({
      loading: bool,
      error: object,
      companyPurchases: arrayOf(object)
    }).isRequired,
    subscribe: func.isRequired
  }
  componentDidMount () {
    this.props.subscribe()
  }
  addMessage = () => {
    this.props.mutate()
  }
  render () {
    const {data} = this.props

    if (data.error) {
      return <h3>An error has ocurred</h3>
    }
    if (data.loading) {
      return <h3>Loading...</h3>
    }

    return (
      <div>
        <h3>You should be seeing the subscription in the button above</h3>
        <ul>
          {data.messages.map(({id, text}) => (
            <li key={id}>{text}</li>
          ))}
        </ul>
        <button type='button' onClick={this.addMessage}>Add message</button>
      </div>
    )
  }
}

const messagesQuery = gql`
  query Messages {
    messages {
      id
      text
    }
  }
`

const messagesMutation = gql`
  mutation AddMessage {
    addMessage {
      done
    }
  }
`

const messagesSubscription =  gql`
  subscription MessageAdded {
    messageAdded {
      id
      text
    }
  }
`

const query = graphql(messagesQuery, {
  props: ({data}) => ({
    data,
    subscribe: () => (
      data.subscribeToMore({
        document: messagesSubscription,
        updateQuery: (prev, {subscriptionData: {data}}) => ({
          ...prev,
          messages: [...prev.messages, data.messageAdded]
        }),
        onError (error) {
          console.log(error)
        }
      })
    )
  })
})

const mutation = graphql(messagesMutation)

export default compose(
  withData,
  query,
  mutation
)(Home)
