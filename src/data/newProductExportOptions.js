export const newProductExportDefaults = {
  optionName1: "Color",
  requiresShipping: true,
  inventoryPolicyEnabled: false,
  inventoryTrackingEnabled: false,
  trackQuantity: true,
  vendor: "",
  totalQuantity: "",
  status: "draft",
  quickbooksProductId: "",
  productTitle: "",
  productType: "",
  productTags: "",
  inventoryQuantity: "0",
};

export const newProductProductFields = [
  {
    key: "optionName1",
    header: "option name 1",
    label: "Option name 1",
    placeholder: "Color",
  },
  {
    key: "vendor",
    header: "vendor",
    label: "Vendor",
    placeholder: "Example: SetterCloset",
  },
  {
    key: "totalQuantity",
    header: "qty.total",
    label: "Total quantity (qty.total)",
    placeholder: "Example: 1",
  },
  {
    key: "status",
    header: "status",
    label: "Status",
    placeholder: "Example: draft",
  },
  {
    key: "quickbooksProductId",
    header: "quickbooks.pID",
    label: "QuickBooks product ID (quickbooks.pID)",
    placeholder: "Example: Macros:Absolute - Kilter:KVA025",
  },
  {
    key: "productTitle",
    header: "product title",
    label: "Product title",
    placeholder: "Example: Hollow #40",
  },
  {
    key: "productType",
    header: "product type",
    label: "Product type",
    placeholder: "Example: Grips",
  },
  {
    key: "productTags",
    header: "product tags",
    label: "Product tags",
    placeholder: "Comma-separated tags",
  },
];

export const newProductVariantTextFields = [
  {
    key: "inventoryQuantity",
    header: "inventory quantity",
    label: "Inventory quantity",
    placeholder: "Example: 0",
  },
];
