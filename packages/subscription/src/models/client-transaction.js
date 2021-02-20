import dayjs from 'dayjs'
import pg from '../pg.js'

export async function findAll(
  { account_id, application_id, client_id, start_date, end_date },
  { limit = 10, cursor } = {},
) {
  return pg
    .queryBuilder()
    .select({
      client_id: 't.client_id',
      transaction_type: 't.transaction_type',
      event_date: pg.raw(`TO_CHAR(t.event_date, 'YYYY-MM-DD')`),
      base_client_purchase: 't.base_client_purchase',
      base_developer_proceeds: 't.base_developer_proceeds',
      subscription_package_id: 't.subscription_package_id',
      subscription_package_name: 'sp.name',
      application_id: 't.application_id',
      country_id: 'co.country_id',
      country_name: 'co.name',
    })
    .from('client_transactions as t')
    .innerJoin('subscription_packages as sp', function () {
      this.on('sp.subscription_package_id', 't.subscription_package_id').andOn(
        'sp.account_id',
        't.account_id',
      )
    })
    .innerJoin('clients as c', function () {
      this.on('c.client_id', 't.client_id').andOn(
        'c.account_id',
        't.account_id',
      )
    })
    .innerJoin('countries as co', 'co.country_id', 'c.country_id')
    .where('t.account_id', account_id)
    .andWhere(function () {
      if (application_id?.length) {
        this.andWhere('t.application_id', application_id)
      }

      if (client_id?.length) {
        this.andWhere('t.client_id', client_id)
      }

      if (cursor) {
        const { client_id, event_date } = cursor

        if (!client_id || !event_date) {
          throw new Error(`Invalid cursor for pagination`)
        }

        this.whereRaw(`(t.event_date, t.client_id) < (?, ?)`, [
          dayjs(event_date).format('YYYY-MM-DD'),
          client_id,
        ])
      }

      if (start_date && end_date) {
        this.andWhereBetween('t.event_date', [
          dayjs(start_date).format('YYYY-MM-DD'),
          dayjs(end_date).format('YYYY-MM-DD'),
        ])
      }
    })
    .orderByRaw(`t.event_date desc, t.client_id desc`)
    .limit(limit)
}