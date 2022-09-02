import {
  Card,
  Page,
  DataTable,
  Pagination,
  IndexTable,
  useIndexResourceState,
  TextStyle,
  Thumbnail,
} from "@shopify/polaris";
import { useState } from "react";
import { useAppQuery } from "../hooks";
import { ImageMajor } from "@shopify/polaris-icons";

export default function HomePage() {
  const [cursor, setCursor] = useState(null);
  const [next, setNext] = useState(true);
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

  console.log(rowMarkup);

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
  return (
    <Page title="Product Info">
      <Card>
        {/* <DataTable
          columnContentTypes={["text", "numeric", "numeric"]}
          headings={["Product", "Price", "Number of Variants"]}
          rows={isLoadingData ? [] : populateTable()}
        /> */}

        <IndexTable
          resourceName={resourceName}
          itemCount={isLoadingData ? 0 : products.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
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
    </Page>
  );
}
