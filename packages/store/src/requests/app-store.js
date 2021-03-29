import scraper from 'appstore-sensor'
import tunnel from 'tunnel'
import config from '../config.js'
import logger from '../logger.js'

const extraOptions = config.isProxyEnabled
  ? {
      agent: {
        https: tunnel.httpsOverHttp({
          proxy: config.proxy,
        }),
      },
    }
  : {}

export async function scrapeApp(application_id, country_id, language) {
  let detail = null

  try {
    detail = await scraper.app(
      {
        id: application_id,
        country: country_id,
        language: language,
        include_ratings: true,
      },
      {
        timeout: 5000,
        ...extraOptions,
      },
    )
  } catch (error) {
    if (!error.message?.includes('not found')) {
      logger.error(
        `Received ${error.message} on application_id=${application_id}, country_id=${country_id} and language=${language}`,
      )
      throw error
    }
  }

  if (detail === null) {
    return null
  }

  return {
    application_id,
    country_id,
    default_country_id: country_id,
    default_language_id: language,
    detail,
  }
}

export async function scrapeReviews(application_id, country_id, page) {
  const reviews = await scraper.reviews(
    {
      id: application_id,
      country: country_id,
      page,
      sort: 'mostRecent',
    },
    {
      timeout: 5000,
      ...extraOptions,
    },
  )

  return reviews
}