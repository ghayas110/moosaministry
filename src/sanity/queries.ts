import { groq } from "next-sanity";

export const allCategoriesQuery = groq`
  *[_type == "category" && isActive == true] | order(displayOrder asc) {
    _id, name, "slug": slug.current, icon, displayOrder
  }
`;

export const menuItemsQuery = groq`
  *[_type == "menuItem" && isAvailable == true] | order(category->displayOrder asc, _createdAt asc) {
    _id, name, "slug": slug.current, description, price, spiceLevel,
    images, isFeatured, allergens, tags,
    "category": category->{_id, name, "slug": slug.current},
    variants
  }
`;

export const featuredItemsQuery = groq`
  *[_type == "menuItem" && isAvailable == true && isFeatured == true] | order(_createdAt desc)[0...6] {
    _id, name, "slug": slug.current, description, price, spiceLevel, images,
    "category": category->{name, "slug": slug.current}
  }
`;

export const menuItemBySlugQuery = groq`
  *[_type == "menuItem" && slug.current == $slug][0] {
    _id, name, description, price, spiceLevel, images, allergens, variants, tags,
    "category": category->{name, "slug": slug.current}
  }
`;

export const ordersQuery = groq`
  *[_type == "order"] | order(_createdAt desc)[0...100] {
    _id, orderNumber, type, items, subtotal, tax, discount, total,
    paymentMethod, paymentStatus, orderStatus, kdsStatus,
    tableNumber, customerName, customerPhone, _createdAt, _updatedAt
  }
`;

export const activeKdsTicketsQuery = groq`
  *[_type == "order" && kdsStatus in ["pending", "in-progress"]] | order(_createdAt asc) {
    _id, orderNumber, type, tableNumber, customerName,
    items[]{
      "name": menuItem->name, quantity, notes, variants,
      preparedItems
    },
    kdsStatus, orderStatus, priority, _createdAt
  }
`;

export const recentBumpedQuery = groq`
  *[_type == "order" && kdsStatus == "completed"] | order(_updatedAt desc)[0...8] {
    _id, orderNumber, type, _updatedAt
  }
`;

export const ingredientsQuery = groq`
  *[_type == "ingredient"] | order(name asc) {
    _id, name, unit, currentStock, restockThreshold, costPerUnit,
    lastRestocked, "supplier": supplier->{_id, name, phone}
  }
`;

export const lowStockQuery = groq`
  *[_type == "ingredient" && currentStock <= restockThreshold] | order(currentStock asc) {
    _id, name, unit, currentStock, restockThreshold
  }
`;

export const tablesQuery = groq`
  *[_type == "table"] | order(tableNumber asc) {
    _id, tableNumber, section, capacity, isOccupied,
    "currentOrder": currentOrder->{_id, orderNumber, total, _createdAt}
  }
`;

export const staffByPinQuery = groq`
  *[_type == "staff" && pin == $pin && isActive == true][0] {
    _id, name, role
  }
`;

export const orderByIdQuery = groq`
  *[_type == "order" && (_id == $id || orderNumber == $id)][0] {
    _id, orderNumber, type, items, subtotal, tax, discount, total,
    paymentMethod, paymentStatus, orderStatus, kdsStatus,
    tableNumber, customerName, customerPhone, deliveryAddress,
    _createdAt, _updatedAt
  }
`;

export const purchaseOrdersQuery = groq`
  *[_type == "purchaseOrder"] | order(_createdAt desc) {
    _id, poNumber, status, totalCost, expectedDelivery, receivedAt, _createdAt,
    "supplier": supplier->{name, phone},
    items[]{ "ingredient": ingredient->{name, unit}, quantity, unitCost }
  }
`;

export const inventoryLogsQuery = groq`
  *[_type == "inventoryLog"] | order(timestamp desc)[0...50] {
    _id, type, quantityChange, reason, timestamp, performedBy,
    "ingredient": ingredient->{name, unit}
  }
`;
