import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Moosa Ministry")
    .items([
      S.listItem()
        .title("Menu")
        .child(
          S.list()
            .title("Menu")
            .items([
              S.documentTypeListItem("category").title("Categories"),
              S.documentTypeListItem("menuItem").title("Menu Items"),
            ])
        ),
      S.divider(),
      S.listItem()
        .title("Operations")
        .child(
          S.list()
            .title("Operations")
            .items([
              S.documentTypeListItem("order").title("Orders"),
              S.documentTypeListItem("table").title("Tables"),
              S.documentTypeListItem("staff").title("Staff"),
            ])
        ),
      S.divider(),
      S.listItem()
        .title("Inventory")
        .child(
          S.list()
            .title("Inventory")
            .items([
              S.documentTypeListItem("ingredient").title("Ingredients"),
              S.documentTypeListItem("supplier").title("Suppliers"),
              S.documentTypeListItem("purchaseOrder").title("Purchase Orders"),
              S.documentTypeListItem("inventoryLog").title("Inventory Logs"),
            ])
        ),
    ]);
