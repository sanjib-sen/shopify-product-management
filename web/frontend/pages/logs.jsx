import { useAppQuery } from "../hooks";
import { IndexTable, Page, Layout, Card, TextStyle } from "@shopify/polaris";

export default function ShowLogs() {
  const {
    data: logs,
    refetch: refetchLogs,
    isLoading: isLoadingData,
  } = useAppQuery({
    url: `/api/logger`,
    reactQueryOptions: {
      refetchInterval: 5000,
    },
  });

  const rowMarkup = logs
    ? logs.map((d, index) => (
        <IndexTable.Row id={d.updatedAt} key={d.updatedAt} position={index}>
          <IndexTable.Cell>
            <TextStyle variation="strong">{d.name}</TextStyle>
          </IndexTable.Cell>
          <IndexTable.Cell>{d.updatedAt}</IndexTable.Cell>
          <IndexTable.Cell>{d.atr}</IndexTable.Cell>
        </IndexTable.Row>
      ))
    : "[]";
  const resourceName = {
    singular: "Log",
    plural: "Logs",
  };

  console.log(logs);
  return (
    <Page title="Product Update Logs">
      <Layout>
        <Layout.Section>
          <Card>
            <IndexTable
              selectable={false}
              resourceName={resourceName}
              itemCount={!logs ? 0 : logs.length}
              headings={[
                { title: "Product Name" },
                { title: "Date and Time" },
                { title: "Updated Attribute" },
              ]}
            >
              {isLoadingData ? [] : rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
