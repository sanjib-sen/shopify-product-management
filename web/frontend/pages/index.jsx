import { Card, Page, DataTable, Pagination } from "@shopify/polaris";
import { useState } from "react";
import { useAppQuery } from "../hooks";

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

  const populateTable = () => {
    const dataTable = [];
    if (data && !isLoadingData) {
      data.edges.map((d) => {
        const singleRow = [];
        singleRow.push(d.node.title);
        singleRow.push(`${d.node.priceRangeV2.minVariantPrice.amount} USD`);
        singleRow.push(d.node.totalVariants);
        dataTable.push(singleRow);
      });
    }
    return dataTable;
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
        <DataTable
          columnContentTypes={["text", "numeric", "numeric"]}
          headings={["Product", "Price", "Number of Variants"]}
          rows={isLoadingData ? [] : populateTable()}
        />
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
