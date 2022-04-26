import assert from "assert"
import fetch from "cross-fetch";
import {HexString} from "./HexString.js";

export class FaucetClient {
    url = "";
    aptos = null;

    constructor(url = "", aptos) {
        this.url = url
        this.aptos = aptos
    }

    /** This creates an account if it does not exist and mints the specified amount of
     coins into that account */
    async fundAddress(address = "", amount = 0) {
        const url = `${this.url}/mint?amount=${amount}&address=${new HexString(address).noPrefix()}`
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
            await this.aptos.waitForTransaction(tnxHash);
        }

        return tnxHashesArray.length === 0 ?
            null :
            tnxHashesArray.length === 1 ?
                tnxHashesArray[0] :
                tnxHashesArray
    }
}