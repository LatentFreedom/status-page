import type { Metadata } from "next";
import "@latentfreedom/status-page/styles.css";
import { buildMetadata } from "@latentfreedom/status-page/next";
import { StatusLayout } from "@latentfreedom/status-page/react";
import config from "../../status.config";

export const metadata: Metadata = buildMetadata(config);

export default StatusLayout;
