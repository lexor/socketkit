import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'

import test from 'ava'

import { build } from '../src/grpc.js'
import pg from '../src/pg.js'

import { getRandomPort, getClients } from './client.js'
import { facebook_application, test_account_id } from './seeds.js'

const app = build()

test.before(async (t) => {
  const port = getRandomPort()

  Object.assign(t.context, getClients(port))

  await app.start(`0.0.0.0:${port}`)

  await promisify(t.context.applications.create).bind(t.context.applications)({
    rows: [facebook_application],
  })
})

test.after(async () => {
  await pg.destroy()
  await app.close()
})

test('findAll should return available integrations', async (t) => {
  const { integrations } = t.context
  const findAll = promisify(integrations.findAll).bind(integrations)
  const response = await findAll({ account_id: test_account_id })

  t.truthy(response)
  t.true(Array.isArray(response.rows))
})

test('findAll should validate account_id', async (t) => {
  const { integrations } = t.context
  const findAll = promisify(integrations.findAll).bind(integrations)

  try {
    await findAll({ account_id: 'ahmet' })
    throw new Error('should not be here')
  } catch (error) {
    t.not(error.message, 'should not be here')
    t.true(error.message.includes('Invalid account id'))
  }
})

test('upsertAll should validate account_id', async (t) => {
  const { integrations } = t.context
  const upsertAll = promisify(integrations.upsertAll).bind(integrations)

  try {
    await upsertAll({ account_id: 'ahmet' })
    throw new Error('should not be here')
  } catch (error) {
    t.not(error.message, 'should not be here')
    t.true(error.message.includes('Invalid account id'))
  }
})

test('upsertAll should upsert', async (t) => {
  const { integrations } = t.context
  const upsertAll = promisify(integrations.upsertAll).bind(integrations)
  const response = await upsertAll({ account_id: randomUUID(), applications: [] })

  t.deepEqual(response, {})
})
