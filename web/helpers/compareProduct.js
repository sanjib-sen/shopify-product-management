const strings = ["title", "vendor", "product_type", "handle", "status", "tags"];

export function compareProductJSON(product1, product2) {
  for (let i = 0; i < product1.variants.length; i++) {
    const variant1 = product1.variants[i];
    const variant2 = product2.variants[i];
    for (let key in variant1) {
      if (variant2[key] != variant1[key] && key != "updated_at") return key;
    }
  }
  for (let s in strings) {
    if (
      product1[strings[s]] != product2[strings[s]] &&
      strings[s] != "updated_at"
    ) {
      return strings[s];
    }
  }

  if (JSON.stringify(product1.images) != JSON.stringify(product2.images)) {
    return "image";
  }

  if (JSON.stringify(product1.options) != JSON.stringify(product2.options)) {
    return "options";
  }

  return "description";
}
