export function convertIdToProduct(id, multiple = false) {
  if (!multiple) {
    return "gid://shopify/Product/" + id;
  } else {
    const productIds = id.split("-");
    const ids = [];
    productIds.map((p) => {
      const newStr = "gid://shopify/Product/" + p;
      ids.push(newStr);
    });
    return ids;
  }
}
