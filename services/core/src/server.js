import f from 'fastify'

import pressure from 'under-pressure'
import cors from 'fastify-cors'
import compress from 'fastify-compress'
import helmet from 'fastify-helmet'
import auth from 'fastify-auth'
import sensible from 'fastify-sensible'
import metrics from 'fastify-metrics'
import rawBody from 'fastify-raw-body'
import qs from 'qs'

import ajv from './validation.js'
import grpc from './plugins/custom.js'
import routes from './routes/index.js'
import pg from './pg.js'
import logger from './logger.js'

import grpcjs from '@grpc/grpc-js'

export default async function build() {
  const server = f({
    querystringParser: (str) => qs.parse(str, { plainObjects: true }),
    trustProxy: true,
    disableRequestLogging: true,
    logger: false,
    ajv,
  })

  server.setErrorHandler(async (error) => {
    if (error.code) {
      // Handle grpc related error codes.
      switch (error.code) {
        case grpcjs.status.NOT_FOUND:
          throw server.httpErrors.notFound(error.message)
        case grpcjs.status.PERMISSION_DENIED:
          throw server.httpErrors.unauthorized(error.message)
        case grpcjs.status.RESOURCE_EXHAUSTED:
          throw server.httpErrors.serviceUnavailable(error.message)
        default:
          logger.fatal(error)
          throw server.httpErrors.internalServerError('Something went wrong')
      }
    } else if (error.statusCode) {
      // Handle custom error codes
      throw error
    } else {
      // Handle uncaught errors due to runtime issues
      logger.error(error)
      throw server.httpErrors.internalServerError('Something went wrong')
    }
  })

  server.register(pressure, {
    healthCheck: async function () {
      await pg.raw('select 1+1 as result')
      return true
    },
    healthCheckInterval: 1000,
    exposeStatusRoute: '/health',
  })
  server.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
  })
  server.register(grpc)
  server.register(sensible, {
    errorHandler: false,
  })
  server.register(auth)
  server.register(cors, {
    credentials: true,
    origin: [/\.socketkit\.com$/],
    methods: 'GET,POST,OPTIONS,PUT,DELETE',
    allowedHeaders: [
      'Authorization',
      'Accept',
      'Origin',
      'DNT',
      'Keep-Alive',
      'User-Agent',
      'X-Requested-With',
      'X-Request-Id',
      'If-Modified-Since',
      'Cache-Control',
      'Content-Type',
      'Content-Range',
      'Range',
    ],
    maxAge: 1728000,
  })
  server.register(compress)
  server.register(helmet)
  server.register(metrics, { endpoint: '/metrics' })
  server.register(routes, { prefix: '/v1' })
  server.get('/', async () => ({ status: 'up' }))

  return server
}
