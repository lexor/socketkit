import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import useSWR, { mutate } from 'swr'

import Notification from 'components/notification.js'
import Button from 'components/form/button.js'
import { useRouter } from 'next/router'
import { fetcher } from '../../../helpers/fetcher.js'

export default function IntegrationDetail() {
  const router = useRouter()
  const { slug } = router.query
  const [loading, setLoading] = useState(false)
  const { handleSubmit, register } = useForm()

  const { data: integration } = useSWR(`integrations/${slug}`)
  const { data: userIntegrations } = useSWR('users/me/integrations')
  const existing = (userIntegrations ?? [])[0]?.requirement_payload

  async function onSubmit(values) {
    setLoading(true)

    try {
      await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/users/me/integrations`, {
        method: 'PUT',
        body: JSON.stringify({
          integration_id: slug,
          requirement_payload: values,
        }),
      })
      mutate('users/me/integrations')
      toast(
        <Notification description="Successfully updated integration" title="Integration updated" />,
      )
      history.replace('/settings/integrations')
    } catch (error) {
      toast(<Notification description={error.message} title="Request failed" />)
    } finally {
      setLoading(false)
    }
  }

  console.log('integration', integration)

  return (
    <section aria-labelledby="integration_details_heading">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="shadow sm:rounded-md sm:overflow-hidden">
          <div className="bg-white py-6 px-4 sm:p-6">
            <div>
              <h2
                className="text-lg leading-6 font-medium text-gray-900"
                id="payment_details_heading">
                {integration?.title ?? 'Integration'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your integration settings. Learn more from{' '}
                <a
                  className="inline underline text-blueGray-800 text-sm font-medium"
                  href="https://help.chartmogul.com/hc/en-us/articles/360000109609">
                  our competitor
                </a>
                .
              </p>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-6">
              {Object.keys(integration?.requirement_schema.properties ?? {}).map((key) => (
                <div className="col-span-4" key={key}>
                  <label className="block text-sm font-medium text-gray-700" htmlFor={key}>
                    {key}
                  </label>
                  <input
                    ref={register({ required: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    defaultValue={(existing && existing[key]) || ''}
                    name={key}
                    type="text"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Button
              className="bg-gray-800 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              loading={loading}
              type="submit">
              {existing !== undefined ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
