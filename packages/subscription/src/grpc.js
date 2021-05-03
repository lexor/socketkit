import Sentry from '@sentry/node'
import Mali from 'mali'
import path from 'path'
import * as Subscribers from './consumers/subscriber/index.js'
import * as Integrations from './consumers/integration/index.js'
import * as Reports from './consumers/reports/index.js'
import * as Subscriptions from './consumers/subscription/index.js'
import * as Transactions from './consumers/transaction/index.js'
import Logger from './logger.js'

const logger = Logger.create().withScope('grpc')
const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
}
const file = path.join(path.resolve(''), 'protofiles/subscription.proto')
const health = path.join(path.resolve(''), 'protofiles/health.proto')

const app = new Mali()

app.addService(
  file,
  ['Subscribers', 'Subscriptions', 'Transactions', 'Integrations', 'Reports'],
  options,
)
app.addService(health, 'Health', options)

app.use(async (context, next) => {
  logger.withScope('grpc').debug(`Receiving ${context.fullName}`)

  let tracer = null

  if (!context.fullName.includes('health')) {
    tracer = Sentry.startTransaction({
      name: context.fullName,
      op: 'GET',
      trimEnd: true,
    })

    Sentry.setUser({
      ...context.request.metadata,
      account_id: context.request.req.account_id,
    })
  }

  return next().then(() => tracer?.finish())
})

app.use({
  Subscribers,
  Subscriptions,
  Transactions,
  Integrations,
  Reports,
})
app.use('grpc.health.v1.Health', 'Check', (ctx) => (ctx.res = { status: 1 }))

app.on('error', (error) => {
  if (!error.code) {
    Sentry.captureException(error)
    logger.fatal(error)
  }
})

export default app
