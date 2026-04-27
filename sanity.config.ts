"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemas";
import { structure } from "./src/sanity/structure";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  title: "Moosa Ministry CMS",
  schema: { types: schemaTypes },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
