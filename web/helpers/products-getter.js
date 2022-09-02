import { Shopify } from "@shopify/shopify-api";
export async function productsGetter(session, count, next, cursor) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  let string = '"';
  string += cursor;
  string += '"';
  cursor = string;

  if (cursor == '"null"') {
    cursor = null;
  }
  let queryString = "";

  if (next == "true") {
    queryString = `{
        products (first: ${count}, after: ${cursor}) {
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
              featuredImage {
                url
              }
            }
          }
          pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
          }
        }
      }`;
  } else if (next == "false") {
    queryString = `{
        products (last: ${count}, before: ${cursor}) {
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
              featuredImage {
                url
              }
            }
          }
          pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
          }
        }
      }`;
  }

  const response = await client.query({
    data: {
      query: queryString,
    },
  });
  return response;
}
