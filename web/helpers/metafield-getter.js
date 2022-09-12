import { Shopify } from "@shopify/shopify-api";

export async function metafieldGetter(
  session,
  id = "gid://shopify/Metafield/23108549116144"
) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  const queryString = `{
    metafield(id: "${id}") {
        namespace
        key
        value
      }
    }`;

  const response = await client.query({
    data: {
      query: queryString,
    },
  });

  return response.body.data.metafield.value;
}
