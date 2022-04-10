import SHA3 from "js-sha3"
import Nacl from "tweetnacl"
import { Buffer } from 'buffer'
import {HexString} from "./HexString.js";
import {entropyToMnemonic, mnemonicToEntropy} from "bip39";

const {sign} = Nacl
const {sha3_256} = SHA3

export class Account {
    signingKey = {}
    accountAddress = ""
    accountAuthKey = ""

    constructor(privateKey){
        if (privateKey) {
            if (typeof privateKey === "string") {
                privateKey = Uint8Array.from(Buffer.from(privateKey, 'hex'))
            }
            this.signingKey = sign.keyPair.fromSeed(privateKey.slice(0, 32))
        } else {
            this.signingKey = sign.keyPair()
        }
        this.accountAddress = new HexString(this.authKey()).hex()
    }

    privateKey(){
        return Buffer.from(this.signingKey.secretKey).toString("hex").slice(0, 64)
    }

    address(){
        return this.accountAddress
    }

    authKey(){
        if (!this.accountAuthKey) {
            let hash = sha3_256.create()
            hash.update(Buffer.from(this.signingKey.publicKey))
            hash.update("\x00")
            this.accountAuthKey = hash.hex()
        }
        return this.accountAuthKey
    }

    pubKey(){
        return new HexString(Buffer.from(this.signingKey.publicKey).toString("hex")).toString()
    }

    signBuffer(buffer){
        const signature = sign(buffer, this.signingKey.secretKey)
        return new HexString(Buffer.from(signature).toString("hex").slice(0, 128)).toString();
    }

    signHexString(hexString){
        const toSign = new HexString(hexString).toBuffer();
        return this.signBuffer(toSign);
    }

    mnemonic(){
        return entropyToMnemonic(this.privateKey())
    }

    toObject() {
        return {
            address: this.address(),
            publicKey: this.pubKey(),
            privateKey: this.privateKey(),
            mnemonic: this.mnemonic()
        };
    }
}

Account.fromSeed = (seed) => new Account(seed)
Account.fromObject = (accountObject) => new Account(accountObject.privateKey)
Account.fromMnemonic = (mnemonic) => new Account(mnemonicToEntropy(mnemonic))