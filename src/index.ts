import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";
import { connect } from "http2";
const solanaWeb3 = require("@solana/web3.js");
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

function loadKeypair(path: string): Keypair {
  const secretKeyString = fs.readFileSync(path, "utf8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

async function main() {
  const walletKeyPair = loadKeypair("../solana-web3js/01-wallet/wallet.json");
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  let balance = await connection.getBalance(walletKeyPair.publicKey);
  console.log(balance / solanaWeb3.LAMPORTS_PER_SOL);

  if (balance < 0.01 * 1e9) {
    console.log("❌ 余额不足，请先充值 SOL");
    // Airdrop 一些 SOL 以便支付手续费
    const airdropSignature = await connection.requestAirdrop(
      walletKeyPair.publicKey,
      5 * LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction({
      signature: airdropSignature,
      blockhash,
      lastValidBlockHeight,
    });
    console.log("Airdrop 完成");
  }
  console.log("📝 正在创建新的 Token Mint...");

  const mint = await createMint(
    connection,
    walletKeyPair,
    walletKeyPair.publicKey,
    null,
    9,
    undefined,
    {},
    TOKEN_PROGRAM_ID,
  );
  console.log("✅ Token Mint 地址:", mint.toBase58());
  console.log("📝 正在为支付者创建 Token Account...");

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeyPair,
    mint,
    walletKeyPair.publicKey,
  );

  console.log("✅ 支付者 Token Account:", tokenAccount.address.toBase58());
  console.log(`   当前余额: ${tokenAccount.amount}\n`);

  const mintSignature = await mintTo(
    connection,
    walletKeyPair,
    mint,
    tokenAccount.address,
    walletKeyPair.publicKey,
    1000 * 1e9,
  );
  console.log("✅ 铸造成功！");
  console.log("   交易签名:", mintSignature);

  const updatedAccount = await getAccount(connection, tokenAccount.address);
  console.log(`   新余额: ${Number(updatedAccount.amount) / 1e9} tokens\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
