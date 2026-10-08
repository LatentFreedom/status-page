import { StatusPage } from "@latentedge/status-page/react";
import config from "../../status.config";

export default function Home() {
  // Only what the page renders crosses to the client, not the worker's roster.
  const { title, logo, apiBase } = config;
  return <StatusPage config={{ title, logo, apiBase }} />;
}
