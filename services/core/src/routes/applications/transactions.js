import { verify } from '../../hooks.js'
import grpc from '../../grpc.js'

const region_names = new Intl.DisplayNames(['en'], { type: 'region' })

export default {
  method: 'GET',
  path: '/:application_id/transactions',
  schema: {
    params: {
      type: 'object',
      properties: {
        application_id: { type: 'string' },
      },
      required: ['application_id'],
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10, minimum: 10 },
        cursor: {
          type: 'object',
          properties: {
            subscriber_id: { type: 'string' },
            event_date: { type: 'string' },
          },
        },
        start_date: {
          type: 'string',
          format: 'date',
        },
        end_date: {
          type: 'string',
          format: 'date',
        },
      },
      required: ['start_date', 'end_date'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          cursor: {
            type: ['object', 'null'],
            properties: {
              subscriber_id: { type: 'string' },
              event_date: { type: 'string' },
            },
          },
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subscriber_id: { type: 'string' },
                transaction_type: { type: 'string' },
                event_date: { type: 'string' },
                base_subscriber_purchase: { type: 'string' },
                base_developer_proceeds: { type: 'string' },
                subscription_package_id: { type: 'string' },
                subscription_package_name: { type: 'string' },
                application_id: { type: 'string' },
                country_id: { type: 'string' },
                country_name: { type: 'string' },
              },
            },
          },
        },
        required: ['cursor', 'rows'],
      },
    },
  },
  preHandler: verify,
  handler: async ({
    accounts: [account],
    query,
    params: { application_id },
  }) => {
    const { rows, cursor } = await grpc.transactions.findAll({
      account_id: account.account_id,
      application_id,
      limit: query.limit,
      start_date: query.start_date,
      end_date: query.end_date,
      cursor: query.cursor,
    })

    return {
      rows: rows.map(({ country_id, ...rest }) => ({
        country_id,
        country_name: region_names.of(country_id.toUpperCase()),
        ...rest,
      })),
      cursor,
    }
  },
}