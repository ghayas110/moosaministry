import { defineField, defineType } from "sanity";

export const menuItem = defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (R) => R.required(),
    }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (R) => R.required(),
    }),
    defineField({
      name: "price",
      type: "number",
      validation: (R) => R.required().min(0),
      description: "Price in PKR",
    }),
    defineField({
      name: "images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "spiceLevel",
      type: "number",
      initialValue: 0,
      validation: (R) => R.min(0).max(5),
      description: "0–5 (Korean pepper rating)",
    }),
    defineField({ name: "isAvailable", type: "boolean", initialValue: true }),
    defineField({ name: "isFeatured", type: "boolean", initialValue: false }),
    defineField({
      name: "variants",
      type: "array",
      of: [
        {
          type: "object",
          name: "variantGroup",
          fields: [
            { name: "name", type: "string", title: "Group name (e.g. Broth, Spice)" },
            {
              name: "options",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "label", type: "string" },
                    { name: "priceModifier", type: "number", initialValue: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: "allergens",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: ["gluten", "dairy", "egg", "peanut", "tree-nut", "soy", "shellfish", "fish", "sesame"],
      },
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: { list: ["halal", "vegan", "vegetarian", "spicy", "signature", "new"] },
    }),
    defineField({
      name: "recipe",
      title: "Recipe (ingredients per serving)",
      type: "array",
      of: [
        {
          type: "object",
          name: "recipeLine",
          fields: [
            {
              name: "ingredient",
              type: "reference",
              to: [{ type: "ingredient" }],
              validation: (R) => R.required(),
            },
            { name: "quantityPerServing", type: "number", validation: (R) => R.min(0) },
            { name: "unit", type: "string" },
          ],
          preview: {
            select: { title: "ingredient.name", q: "quantityPerServing", u: "unit" },
            prepare: ({ title, q, u }) => ({ title: title ?? "—", subtitle: `${q ?? 0} ${u ?? ""}` }),
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "category.name", media: "images.0" },
  },
});
