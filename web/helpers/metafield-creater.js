import { Shopify } from "@shopify/shopify-api";
export async function metafieldCreator(
  session,
  ownerId,
  namespace,
  key,
  value,
  type = "single_line_text_field"
) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  const metafields = [
    {
      key: key.toString(),
      namespace: namespace.toString(),
      ownerId: ownerId.toString(),
      type: type,
      value: typeof value == "object" ? JSON.stringify(value) : value,
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

export async function metafieldCreatorLogger(
  session,
  value,
  key = "logger",
  namespace = "product_update",
  type = "json_string",
  ownerId = "gid://shopify/Shop/66124742896"
) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  const metafields = [
    {
      key: key.toString(),
      namespace: namespace.toString(),
      ownerId: ownerId.toString(),
      type: type,
      value: typeof value == "object" ? JSON.stringify(value) : value,
    },
  ];
  const queryString = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
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
