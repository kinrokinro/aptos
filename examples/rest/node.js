import {RestClient} from "../../src/index.js";
import {REST_URL} from "../helpers/consts.js";

const rest = new RestClient(REST_URL)

console.log("=== Node ===")
console.log(await rest.getHealthy())
console.log(await rest.getLedger())
