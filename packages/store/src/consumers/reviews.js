import _ from 'lodash'
import * as Reviews from '../models/reviews.js'

export async function findAll(ctx) {
  const { application_ids, country_ids, version_ids, cursor } = ctx.req
  const rows = await Reviews.findAll(
    { application_ids, country_ids, version_ids },
    { cursor },
  )

  const latest = _.last(rows)

  ctx.res = {
    rows,
    cursor: latest ? _.pick(latest, ['review_id']) : null,
  }
}

export async function findVersions(ctx) {
  const { application_id } = ctx.req
  ctx.res = {
    rows: await Reviews.findVersions({ application_id }),
  }
}