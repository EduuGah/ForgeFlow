function AppPageIntro({ eyebrow, title, description, metrics = [], action }) {
  return (
    <section className="ff-native-page-intro" aria-label={title}>
      <div className="ff-native-page-intro__head">
        <div className="min-w-0">
          {eyebrow && <p className="ff-native-page-intro__eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {action && <div className="ff-native-page-intro__action">{action}</div>}
      </div>

      {metrics.length > 0 && (
        <div className="ff-native-page-intro__metrics">
          {metrics.map((metric) => (
            <div className="ff-native-page-intro__metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default AppPageIntro
