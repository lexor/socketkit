import pg from '../pg.js'
import dayjs from 'dayjs'

export async function findAll(
  { account_id, application_id, start_date, end_date },
  { limit = 10, cursor },
) {
  return pg
    .select({
      client_id: 'c.client_id',
      first_interaction: pg.raw(`TO_CHAR(c.first_interaction, 'YYYY-MM-DD')`),
      total_base_client_purchase: pg.raw(
        'ROUND(c.total_base_client_purchase, 2)',
      ),
      total_base_developer_proceeds: pg.raw(
        'ROUND(c.total_base_developer_proceeds, 2)',
      ),
      country_id: 'c.country_id',
      country_name: 'co.name',
      device_type_id: 'c.device_type_id',
      device_type_name: 't.name',
      provider_id: 'c.provider_id',
    })
    .from('clients as c')
    .innerJoin('countries as co', function () {
      this.using('country_id')
    })
    .innerJoin('device_types as t', function () {
      this.using(['provider_id', 'device_type_id'])
    })
    .where('c.account_id', account_id)
    .andWhere(function () {
      if (application_id) {
        this.whereExists(function () {
          this.select('*')
            .from('client_subscriptions as s')
            .where('s.application_id', application_id)
            .andWhereRaw('s.account_id = c.account_id')
            .andWhereRaw('c.client_id = s.client_id')
        })
      }

      if (cursor) {
        const { first_interaction, client_id } = cursor

        if (!first_interaction || !client_id) {
          throw new Error(`Invalid cursor for pagination`)
        }

        this.whereRaw(`(c.first_interaction, c.client_id) < (?, ?)`, [
          dayjs(first_interaction).format('YYYY-MM-DD'),
          client_id,
        ])
      }

      if (start_date && end_date) {
        this.andWhereBetween('c.first_interaction', [
          dayjs(start_date).format('YYYY-MM-DD'),
          dayjs(end_date).format('YYYY-MM-DD'),
        ])
      }
    })
    .orderBy([
      { column: 'c.first_interaction', order: 'desc' },
      { column: 'c.client_id', order: 'desc' },
    ])
    .limit(limit ?? 10)
}