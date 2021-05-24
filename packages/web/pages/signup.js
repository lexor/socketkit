import dayjs from 'dayjs'
import Form from 'components/form/form.js'

import { client } from 'helpers/is-authorized.js'
import { endpoints } from 'helpers/kratos.js'
import KratosPropTypes from 'helpers/types/kratos.js'

export async function getServerSideProps(ctx) {
  const { flow } = ctx.query

  const redirect = () => {
    ctx.res.statusCode = 302
    ctx.res?.setHeader('Location', endpoints.register)
    return { props: {} }
  }

  if (!flow) {
    return redirect()
  }

  try {
    const { data } = await client.getSelfServiceRegistrationFlow(flow)
    const isBefore = dayjs(data?.expires_at ?? undefined).isBefore(dayjs())

    if (isBefore) {
      return redirect()
    }
    return { props: { kratos: data } }
  } catch (error) {
    return redirect()
  }
}

function SignUp({ kratos }) {
  return (
    <>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900 mb-8">Create an account</h2>
      <Form
        actions={{
          primary: 'Sign in',
          secondary: {
            label: 'Go back to login',
            href: endpoints.login,
          },
        }}
        kratos={kratos}
      />
    </>
  )
}

SignUp.propTypes = { kratos: KratosPropTypes }

export default SignUp
