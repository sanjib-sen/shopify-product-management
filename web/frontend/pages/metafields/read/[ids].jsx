import { useAppQuery } from "../../../hooks";
import { useParams } from "react-router-dom";
import { Page } from "@shopify/polaris";
import {
  Layout,
  Card,
  Heading,
  Thumbnail,
  Stack,
  IndexTable,
  TextStyle,
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";

export default function ShowMetafield() {
  const { ids } = useParams();
  const {
    data: data,
    refetch: refetchProducts,
    isLoading: isLoadingData,
  } = useAppQuery({
    url: `/api/product/${ids}`,
  });

  const products = [];

  if (data && !isLoadingData) {
    data.map((d) => {
      const metafields = [];
      d.metafields.edges.map((n) => {
        const metafield = {
          namespace: n.node.namespace,
          key: n.node.key,
          value: n.node.value,
          id: n.node.id,
        };
        metafields.push(metafield);
      });

      const product = {
        image: d.featuredImage ? d.featuredImage.url : ImageMajor,
        name: d.title,
        metafields: metafields,
      };

      products.push(product);
    });
  }

  const resourceName = {
    singular: "Metafield",
    plural: "Metafields",
  };
  return (
    <Page title="Metafields">
      <Layout>
        <Layout.Section>
          {!isLoadingData ? (
            products.map((p) => {
              const rowMarkup = p.metafields.map((d, index) => (
                <IndexTable.Row id={d.id} key={d.id} position={index}>
                  <IndexTable.Cell>
                    <TextStyle variation="strong">{d.namespace}</TextStyle>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{d.key}</IndexTable.Cell>
                  <IndexTable.Cell>{d.value}</IndexTable.Cell>
                  <IndexTable.Cell>{d.id}</IndexTable.Cell>
                </IndexTable.Row>
              ));
              return (
                <Card
                  sectioned
                  title={
                    <Stack>
                      <Thumbnail
                        source={p.image}
                        alt="placeholder"
                        color="base"
                        size="extraSmall"
                      />
                      <Heading>{p.name}</Heading>
                    </Stack>
                  }
                >
                  <IndexTable
                    selectable={false}
                    resourceName={resourceName}
                    itemCount={isLoadingData ? 0 : products.length}
                    headings={[
                      { title: "Namespace" },
                      { title: "Key" },
                      { title: "Value" },
                      { title: "Metafield ID" },
                    ]}
                  >
                    {isLoadingData ? [] : rowMarkup}
                  </IndexTable>
                </Card>
              );
            })
          ) : (
            <Heading>Fetching Data</Heading>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
