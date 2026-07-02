type RouteLuxMetric = {
  label: string;
  value: string;
};

type RouteLuxMediaProps = {
  alt: string;
  caption: string;
  eyebrow: string;
  metrics?: RouteLuxMetric[];
  priority?: boolean;
  src: string;
  title: string;
  variant: "audio" | "cinema" | "display" | "product";
};

export function RouteLuxMedia({
  alt,
  caption,
  eyebrow,
  metrics = [],
  priority = false,
  src,
  title,
  variant,
}: RouteLuxMediaProps) {
  return (
    <figure className={`route-lux-media route-lux-media--${variant}`}>
      <img
        alt={alt}
        className="route-lux-media__image"
        data-atomic-media=""
        decoding="async"
        draggable={false}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        src={src}
      />
      <figcaption className="route-lux-media__caption">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{caption}</p>
        {metrics.length ? (
          <dl className="route-lux-media__metrics">
            {metrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </figcaption>
    </figure>
  );
}
