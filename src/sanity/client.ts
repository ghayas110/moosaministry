import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { apiVersion, dataset, projectId } from "./env";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});

export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return builder.image(source as any);
}
