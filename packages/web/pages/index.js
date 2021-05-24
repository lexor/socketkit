import { useContext, useState } from 'react'
import dayjs from 'dayjs'
import dynamic from 'next/dynamic'
import useSWR from 'swr'

import { AuthContext } from 'helpers/is-authorized.js'
import { fetcher } from 'helpers/fetcher.js'
import getGreeting from 'helpers/greeting.js'

import DatePicker from 'components/date-picker.js'
import StatisticsWidget from 'components/scenes/dashboard/statistics-widget.js'
import CustomersWidget from 'components/scenes/dashboard/subscribers-widget.js'
import CheckoutButton from 'components/checkout-button.js'

// countries require country list dependency. therefore it should be dynamically loaded
// to reduce page loading time
const CountriesWidget = dynamic(() => import('components/scenes/dashboard/countries-widget'))

export async function getServerSideProps({
  req: {
    headers: { cookie, referer },
  },
}) {
  const headers = { cookie, referer }

  try {
    const [integration, payment] = await Promise.all([
      fetcher(`integrations/appstore-connect`, { headers }),
      fetcher(`payments/state`, { headers }),
    ])

    return {
      props: {
        payment,
        integration,
      },
    }
  } catch (error) {
    console.error(error)
    return {
      props: { payment: { subscription_state: 'inactive' }, integration: { last_fetch: null } },
    }
  }
}

export default function Dashboard({ countries, payment, integration }) {
  const maxDate = dayjs(integration?.last_fetch ?? undefined)
  const { data: paymentsData } = useSWR(`payments/state`, fetcher, { initialData: payment })
  const { session } = useContext(AuthContext)
  const [interval, setInterval] = useState({
    start_date: maxDate.subtract(1, 'month'),
    end_date: maxDate,
  })

  return (
    <>
      <div className="flex flex-1 space-between mb-10 items-center justify-center flex-col md:flex-row space-y-6 md:space-y-0">
        <h3 className="font-extrabold text-warmGray-900 sm:tracking-tight text-3xl flex-1">
          {getGreeting()}, {session?.identity.traits.name?.split(' ')[0]}!
        </h3>

        <DatePicker
          interval={interval}
          setInterval={(interval) => setInterval(interval)}
          maxDate={maxDate.toDate()}
        />
      </div>
      <section className="space-y-10">
        <StatisticsWidget
          range={{ start_date: interval.start_date.format('YYYY-MM-DD'), end_date: interval.end_date.format('YYYY-MM-DD') }}
        />

        {['new', 'canceled'].includes(paymentsData.state) && <CheckoutButton />}

        <CustomersWidget
          range={{ start_date: interval.start_date.format('YYYY-MM-DD'), end_date: interval.end_date.format('YYYY-MM-DD') }}
        />
        <CountriesWidget
          range={{ start_date: interval.start_date.format('YYYY-MM-DD'), end_date: interval.end_date.format('YYYY-MM-DD') }}
        />
      </section>
    </>
  )
}
