import {
  Card,
  Page,
  Pagination,
  IndexTable,
  useIndexResourceState,
  TextStyle,
  Thumbnail,
  Button,
  Stack,
  Layout,
} from "@shopify/polaris";
import { useState } from "react";
import { useAppQuery } from "../hooks";
import { ImageMajor } from "@shopify/polaris-icons";
import { useNavigate } from "@shopify/app-bridge-react";

export default function HomePage() {
  const [cursor, setCursor] = useState(null);
  const [next, setNext] = useState(true);
  const navigate = useNavigate();

  // const {
  //   data: metafield_data,
  //   refetch: mf_refetch,
  //   isLoading: mfIsLoading,
  // } = useAppQuery({
  //   url: "/api/metafields",
  // });

  const {
    data,
    refetch: refetchProducts,
    isLoading: isLoadingData,
  } = useAppQuery({
    url: `/api/products/5/${next}/${cursor}`,
  });

  const products = [];

  if (data && !isLoadingData) {
    data.edges.map((d) => {
      const product = {
        image: d.node.featuredImage ? d.node.featuredImage.url : ImageMajor,
        id: d.node.id,
        name: d.node.title,
        variants: d.node.totalVariants,
        price: `${d.node.priceRangeV2.minVariantPrice.amount} USD`,
      };

      products.push(product);
    });
  }

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);

  const promotedBulkActions = [
    {
      content: "Read Metafields",
      onAction: () => {
        const ids = [];
        selectedResources.map((r) => ids.push(r.split("/")[4]));
        const idStr = ids.join("-");
        navigate(`/metafields/read/${idStr}`);
      },
    },
    {
      content: "Write Metafields",
      onAction: () => {
        const ids = [];
        selectedResources.map((r) => ids.push(r.split("/")[4]));
        const idStr = ids.join("-");
        navigate(`/metafields/write/${idStr}`);
      },
    },
  ];
  const rowMarkup = products.map((d, index) => (
    <IndexTable.Row
      id={d.id}
      key={d.id}
      selected={selectedResources.includes(d.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Thumbnail
          source={d.image}
          alt="placeholder"
          color="base"
          size="small"
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <TextStyle variation="strong">{d.name}</TextStyle>
      </IndexTable.Cell>
      <IndexTable.Cell>{d.price}</IndexTable.Cell>
      <IndexTable.Cell>{d.variants}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  const resourceName = {
    singular: "product",
    plural: "products",
  };
  const handleNextPopulate = async () => {
    setCursor(data.pageInfo.endCursor);
    setNext(true);
    await refetchProducts();
  };
  const handlePreviousPopulate = async () => {
    setCursor(data.pageInfo.startCursor);
    setNext(false);
    await refetchProducts();
  };

  // console.log(selectedResources);

  return (
    <Page title="Product Info">
      <Layout>
        <Layout.Section>
          {" "}
          <Button
            textAlign="right"
            onClick={() => {
              navigate(`/logs`);
            }}
          >
            Show Logs
          </Button>
        </Layout.Section>
        <Layout.Section>
          {" "}
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={isLoadingData ? 0 : products.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              promotedBulkActions={promotedBulkActions}
              headings={[
                { title: "Image" },
                { title: "Name" },
                { title: "Price" },
                { title: "Number of Variants" },
              ]}
            >
              {isLoadingData ? [] : rowMarkup}
            </IndexTable>
          </Card>
          <Pagination
            hasPrevious={
              !isLoadingData && data ? data.pageInfo.hasPreviousPage : false
            }
            onPrevious={handlePreviousPopulate}
            hasNext={!isLoadingData && data ? data.pageInfo.hasNextPage : false}
            onNext={handleNextPopulate}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
