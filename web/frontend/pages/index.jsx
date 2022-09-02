import { TitleBar, Loading } from "@shopify/app-bridge-react";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  SkeletonBodyText,
  DataTable,
} from "@shopify/polaris";

import { useAppQuery } from "../hooks";

export default function HomePage() {
  const { data, isLoading: isLoading } = useAppQuery({
    url: "/api/products",
  });

  const dataTable = [];

  if (data) {
    data.map((d, index) => {
      console.log(d, index);
      const singleRow = [];
      singleRow.push(d.node.title);
      singleRow.push(`${d.node.priceRangeV2.minVariantPrice.amount} USD`);
      singleRow.push(d.node.totalVariants);
      dataTable.push(singleRow);
    });
  }

  const loadingMarkup = isLoading ? (
    <Card sectioned>
      <Loading />
      <SkeletonBodyText />
    </Card>
  ) : null;

  const emptyStateMarkup =
    !isLoading && !data?.length ? (
      <Card sectioned>
        <EmptyState heading="Show products">
          <p>Please create some products first.</p>
        </EmptyState>
      </Card>
    ) : null;

  return (
    <Page title="Product Info">
      <Card>
        <DataTable
          columnContentTypes={["text", "numeric", "numeric"]}
          headings={["Product", "Price", "Number of Variants"]}
          rows={dataTable}
        />
      </Card>
    </Page>
  );
}
