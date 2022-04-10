import assert from "assert"
import fetch from "cross-fetch";

export class FaucetClient {
    url = "";
    restClient = null;

    constructor(url = "", restClient) {
        this.url = url
        this.restClient = restClient
    }

    /** This creates an account if it does not exist and mints the specified amount of
     coins into that account */
    async fundAccount(authKey = "", amount = 0) {
        const url = `${this.url}/mint?amount=${amount}&auth_key=${authKey}`
        const response = await fetch(url, {method: "POST"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text());
        }
        const tnxHashes = await response.json()
        const tnxHashesArray = []

        for(let o in tnxHashes) {
            tnxHashesArray.push(tnxHashes[o])
        }

        for (const tnxHash of tnxHashesArray) {
            await this.restClient.waitForTransaction(tnxHash);
        }
    }
}