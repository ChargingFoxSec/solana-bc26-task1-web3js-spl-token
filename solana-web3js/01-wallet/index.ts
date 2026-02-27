import { Keypair } from "@solana/web3.js";
import fs from "fs";
import { Buffer } from "buffer";

const wallet = Keypair.generate();
const publicKey = wallet.publicKey.toBase58();
const secretKey = wallet.secretKey;

console.log("钱包公钥",publicKey);
console.log("钱包私钥",secretKey);
console.log("私钥base64",Buffer.from(secretKey).toString("base64"));

fs.writeFileSync("./wallet.json",JSON.stringify(Array.from(secretKey)));

const importSecretKey = Uint8Array.from(
  JSON.parse(fs.readFileSync("wallet.json").toString("utf8"))
);
const importWallet = Keypair.fromSecretKey(importSecretKey);

console.log("钱包公钥",importWallet.publicKey.toString());
console.log("钱包私钥",importWallet.secretKey);
console.log("私钥base64",Buffer.from(importWallet.secretKey).toString("base64"));