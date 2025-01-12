import path from 'path'

import ajvFormats from 'ajv-formats'
import Mali from 'mali'

import MaliAjv, { addSchemas } from 'mali-ajv'

import * as Accounts from './endpoints/accounts.js'
import * as Identities from './endpoints/identities.js'
import grpcPerformance from './grpc.performance.js'
import Logger from './logger.js'

import schemas from './schemas/index.js'
const logger = Logger.create({}).withScope('grpc')
const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
}
const file = path.join(path.resolve(''), 'protofiles/accounts.proto')
const health = path.join(path.resolve(''), 'protofiles/health.proto')

const app = new Mali(file, ['Accounts', 'Identities'], options)

app.addService(health, 'Health', options)

ajvFormats(MaliAjv)
app.use(addSchemas(app, schemas))
app.use(grpcPerformance)
app.use({ Accounts, Identities })
app.use('grpc.health.v1.Health', 'Check', (ctx) => (ctx.res = { status: 1 }))

app.on('error', (error) => {
  if (!error.code) {
    logger.fatal(error)
  }
})

export default app
