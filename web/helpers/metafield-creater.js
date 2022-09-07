import { Shopify } from "@shopify/shopify-api";
export async function metafieldCreator(
  session,
  ownerId,
  namespace,
  key,
  value
) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  const metafields = [
    {
      key: key,
      namespace: namespace,
      ownerId: ownerId,
      type: "single_line_text_field",
      value: value,
    },
  ];
  const queryString = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

  const response = await client.query({
    data: {
      query: queryString,
      variables: {
        metafields: metafields,
      },
    },
  });
  console.log(response.body.data.metafieldsSet);
  return response;
}
