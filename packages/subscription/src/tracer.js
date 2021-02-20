import { NodeTracerProvider } from '@opentelemetry/node'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { SimpleSpanProcessor } from '@opentelemetry/tracing'

const provider = new NodeTracerProvider()

registerInstrumentations({
  tracerProvider: provider,
})

provider.register()

provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new JaegerExporter({
      serviceName: 'subscription-worker',
      endpoint: process.env.OC_AGENT_HOST,
    }),
  ),
)

export default provider