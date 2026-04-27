import { defineField, defineType } from "sanity";

export const purchaseOrder = defineType({
  name: "purchaseOrder",
  title: "Purchase Order",
  type: "document",
  fields: [
    defineField({ name: "poNumber", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "supplier",
      type: "reference",
      to: [{ type: "supplier" }],
      validation: (R) => R.required(),
    }),
    defineField({
      name: "items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "ingredient", type: "reference", to: [{ type: "ingredient" }] },
            { name: "quantity", type: "number", validation: (R) => R.min(0) },
            { name: "unitCost", type: "number" },
          ],
        },
      ],
    }),
    defineField({ name: "totalCost", type: "number" }),
    defineField({
      name: "status",
      type: "string",
      options: { list: ["pending", "received", "cancelled"] },
      initialValue: "pending",
    }),
    defineField({ name: "expectedDelivery", type: "date" }),
    defineField({ name: "receivedAt", type: "datetime" }),
    defineField({ name: "createdBy", type: "string" }),
    defineField({ name: "notes", type: "text", rows: 2 }),
  ],
  preview: {
    select: { title: "poNumber", subtitle: "status", supplier: "supplier.name" },
    prepare: ({ title, subtitle, supplier }) => ({
      title: title ?? "PO",
      subtitle: `${supplier ?? ""} · ${subtitle ?? ""}`,
    }),
  },
});
