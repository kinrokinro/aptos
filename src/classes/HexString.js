import { Buffer } from 'buffer'

export class HexString {
    hexString = ""

    constructor(hexString) {
        if (hexString.startsWith("0x")) {
            this.hexString = hexString;
        } else {
            this.hexString = `0x${hexString}`;
        }
    }

    hex() {
        return this.hexString;
    }

    noPrefix() {
        return this.hexString.slice(2);
    }

    toString() {
        return this.hex();
    }

    toBuffer() {
        return Buffer.from(this.noPrefix(), "hex");
    }

    toUint8Array() {
        return Uint8Array.from(this.toBuffer());
    }
}

HexString.fromBuffer = (buffer) => new HexString(Buffer.from(buffer).toString("hex"))
HexString.fromUnit8Array = (arr) => new HexString.fromBuffer(Buffer.from(arr))

export const hexAddress = s => new HexString(s).toString()