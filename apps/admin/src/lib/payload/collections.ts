import type { CollectionConfig } from "payload";

export function defineCollection(config: CollectionConfig): CollectionConfig {
  return {
    admin: {
      hideAPIURL: true,
      ...(config.admin ?? {}),
    },
    versions:
      config.versions ??
      ({
        drafts: {
          autosave: {
            interval: 800,
          },
          schedulePublish: true,
        },
      } satisfies NonNullable<CollectionConfig["versions"]>),
    ...config,
  };
}
