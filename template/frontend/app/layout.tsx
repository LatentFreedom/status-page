import type { Metadata } from "next";
import "@latentedge/status-page/styles.css";
import { buildMetadata } from "@latentedge/status-page/next";
import { StatusLayout } from "@latentedge/status-page/react";
import config from "../../status.config";

export const metadata: Metadata = buildMetadata(config);

export default StatusLayout;
