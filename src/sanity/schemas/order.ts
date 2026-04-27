import { defineField, defineType } from "sanity";

export const order = defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({ name: "orderNumber", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "type",
      type: "string",
      options: {
        list: [
          { title: "Online — Delivery", value: "delivery" },
          { title: "Online — Takeaway", value: "takeaway" },
          { title: "Dine-In", value: "dine-in" },
          { title: "POS — Takeaway", value: "pos-takeaway" },
        ],
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "items",
      type: "array",
      of: [
        {
          type: "object",
          name: "orderItem",
          fields: [
            {
              name: "menuItem",
              type: "reference",
              to: [{ type: "menuItem" }],
              validation: (R) => R.required(),
            },
            { name: "name", type: "string" },
            { name: "quantity", type: "number", validation: (R) => R.min(1) },
            { name: "unitPrice", type: "number" },
            {
              name: "variants",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "group", type: "string" },
                    { name: "label", type: "string" },
                    { name: "priceModifier", type: "number" },
                  ],
                },
              ],
            },
            { name: "notes", type: "string" },
            {
              name: "preparedItems",
              type: "number",
              description: "How many of this line are checked off in KDS",
              initialValue: 0,
            },
          ],
        },
      ],
    }),
    defineField({ name: "subtotal", type: "number" }),
    defineField({ name: "tax", type: "number", initialValue: 0 }),
    defineField({ name: "discount", type: "number", initialValue: 0 }),
    defineField({ name: "total", type: "number" }),
    defineField({
      name: "paymentMethod",
      type: "string",
      options: { list: ["cash", "card", "cod", "split", "unpaid"] },
      initialValue: "unpaid",
    }),
    defineField({
      name: "paymentStatus",
      type: "string",
      options: { list: ["pending", "paid", "refunded", "void"] },
      initialValue: "pending",
    }),
    defineField({
      name: "orderStatus",
      type: "string",
      options: {
        list: ["received", "preparing", "ready", "delivered", "cancelled"],
      },
      initialValue: "received",
    }),
    defineField({
      name: "kdsStatus",
      type: "string",
      options: { list: ["pending", "in-progress", "completed", "bumped"] },
      initialValue: "pending",
    }),
    defineField({ name: "priority", type: "boolean", initialValue: false }),
    defineField({ name: "tableNumber", type: "string" }),
    defineField({ name: "customerName", type: "string" }),
    defineField({ name: "customerPhone", type: "string" }),
    defineField({ name: "deliveryAddress", type: "text", rows: 2 }),
    defineField({ name: "notes", type: "text", rows: 2 }),
    defineField({
      name: "staff",
      type: "reference",
      to: [{ type: "staff" }],
      description: "Staff who took the order (POS)",
    }),
  ],
  preview: {
    select: { title: "orderNumber", subtitle: "type", status: "orderStatus" },
    prepare: ({ title, subtitle, status }) => ({
      title: title ?? "Order",
      subtitle: `${subtitle ?? "?"} · ${status ?? "?"}`,
    }),
  },
  orderings: [
    {
      title: "Newest first",
      name: "createdAtDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
});
