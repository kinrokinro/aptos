# Aptos Core Client

Welcome to Aptos Core Client by Serhii Pimenov. This library contains core client classes to interact with Aptos Blockchain.

## Using
To install Aptos Core Client
```shell
npm install --save @olton/aptos
```

ES
```javascript
import {Accout} from "@olton/aptos"

const account = new Accout()
console.log(account.toObject())
```
```javascript
{
  address: '0xdf518afb07...',
  publicKey: '0xcb289da0eb...',
  privateKey: 'f50ac3b4ce3c...',
  mnemonic: 'vital figure unfold...'
}
```
## Classes

Aptos Core Client implements next classes:
+ **Account** - class for work with Aptos account (create, keys)
+ **Faucet** - client to Aptos faucet
+ **Rest** - main API class

### Account
### Faucet
### Rest