import { Shopify } from "@shopify/shopify-api";
export async function productsGetter(session) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  const queryString = `{
      products (first: 100) {
        edges {
          node {
            id
            title
            priceRangeV2 {
                minVariantPrice{
                        amount
                }
            }
            totalVariants
          }
        }
      }
    }`;
  const response = await client.query({
    data: {
      query: queryString,
    },
  });
  return response;
}
