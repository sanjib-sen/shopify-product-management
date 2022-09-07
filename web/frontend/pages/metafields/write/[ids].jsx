import { useParams } from "react-router-dom";
import { useState, useCallback } from "react";
import {
  TextField,
  Card,
  Page,
  Layout,
  Button,
  Form,
  FormLayout,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../../../hooks";
import { useNavigate } from "@shopify/app-bridge-react";

export default function ReadMetafields() {
  const { ids } = useParams();
  const productIds = ids.split("-");

  const [namespace, setNamespace] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const handleNamespaceChange = useCallback((value) => setNamespace(value), []);
  const handleKeyChange = useCallback((value) => setKey(value), []);
  const handleValueChange = useCallback((value) => setValue(value), []);
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();
  async function handleSubmit() {
    productIds.map(async (p) => {
      await fetch(`/api/metafields/create/${p}/${namespace}/${key}/${value}`);
    });
    navigate(`/`);
  }

  return (
    <Page title="Create Metafields">
      <Layout>
        <Layout.Section>
          <Form>
            <FormLayout>
              <Card sectioned>
                <TextField
                  label="Namespace"
                  value={namespace}
                  onChange={handleNamespaceChange}
                />
                <TextField label="Key" value={key} onChange={handleKeyChange} />
                <TextField
                  label="Value"
                  value={value}
                  onChange={handleValueChange}
                />
              </Card>
            </FormLayout>
            <Button onClick={handleSubmit}>Create Metafields</Button>;
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
