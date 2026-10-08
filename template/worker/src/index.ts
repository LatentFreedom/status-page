import { createStatusWorker } from "@latentedge/status-page/worker";
import config from "../../status.config";

export default createStatusWorker(config);
