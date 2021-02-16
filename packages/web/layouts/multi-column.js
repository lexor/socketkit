import PropTypes from 'prop-types'

function MultiColumnLayout({ leading, center }) {
  return (
    <div className="flex-grow w-full max-w-7xl mx-auto xl:px-8 lg:flex">
      <div className="flex-1 min-w-0 xl:flex">
        <div className="xl:flex-shrink-0 xl:w-64">
          <div className="h-full pl-4 pr-6 py-6 sm:pl-6 lg:pl-8 xl:pl-0">
            <div className="h-full relative" style={{ minHeight: '12rem' }}>
              {leading}
            </div>
          </div>
        </div>

        <div className="lg:min-w-0 lg:flex-1">
          <div className="h-full py-6 px-4 sm:px-6 lg:px-8">
            <div
              className="relative h-full space-y-6"
              style={{ minHeight: '36rem' }}
            >
              {center}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

MultiColumnLayout.propTypes = {
  leading: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  center: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
}

export default MultiColumnLayout
