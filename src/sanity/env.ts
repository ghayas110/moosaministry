export const apiVersion =
  process.env.NEXT_PUBLIC_SANITYS_API_VERSION || "2024-10-01";

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITYS_DATASET,
  "Missing env: NEXT_PUBLIC_SANITYS_DATASET"
);

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITYS_PROJECT_ID,
  "Missing env: NEXT_PUBLIC_SANITYS_PROJECT_ID"
);

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) throw new Error(errorMessage);
  return v;
}
