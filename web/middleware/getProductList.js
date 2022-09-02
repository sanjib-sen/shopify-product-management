import axios from "axios";
export async function getData() {
  const rista = await axios.post(
    "https://sanjib-store-demo.myshopify.com/admin/api/2022-07/graphql.json",
    "\n{\n  products(first: 5) {\n    edges {\n      node {\n        id\n        title\n      }\n    }\n    pageInfo {\n      hasNextPage\n    }\n  }\n}\n",
    {
      headers: {
        "Content-Type": "application/graphql",
        "X-Shopify-Access-Token": "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",
        "Access-Control-Allow-Origin": "*",
      },
      withCredentials: false,
    }
  );
  const res = await rista.data.data.products.edges;
  console.log(res);
  return rs;
}
