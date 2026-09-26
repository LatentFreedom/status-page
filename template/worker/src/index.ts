import { createStatusWorker } from "@latentfreedom/status-page/worker";
import config from "../../status.config";

export default createStatusWorker(config);
