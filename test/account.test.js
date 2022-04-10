import {Account} from "../src/index.js"
import assert from "assert"

describe('Account', () => {
    it('Address length should by 32 bytes', () => {
        assert.equal(new Account().address().length, 66)
    })
})