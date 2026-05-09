// Hand-written IDL matching programs/workspace/src/lib.rs
// Replace this with the auto-generated target/idl/workspace.json after `anchor build`
export const IDL = {
  address: "8SuWfRSyqJxpXXQ57S2hmiwKgFqpf877Gyf89yky8KhC",
  version: "0.1.0",
  name: "workspace",
  instructions: [
    {
      name: "initializeConfig",
      accounts: [
        { name: "config", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "feeBps", type: "u16" },
        { name: "treasury", type: "publicKey" },
      ],
    },
    {
      name: "createPaymentLink",
      accounts: [
        { name: "config", isMut: true, isSigner: false },
        { name: "paymentLink", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "seller", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "linkId", type: "u64" },
        { name: "amount", type: "u64" },
        { name: "description", type: "string" },
        { name: "isX402", type: "bool" },
        { name: "expiresAt", type: "i64" },
      ],
    },
    {
      name: "pay",
      accounts: [
        { name: "config", isMut: true, isSigner: false },
        { name: "paymentLink", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "buyerToken", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "settle",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "paymentLink", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "sellerToken", isMut: true, isSigner: false },
        { name: "treasuryToken", isMut: true, isSigner: false },
        { name: "seller", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "cancelPayment",
      accounts: [
        { name: "paymentLink", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "buyerToken", isMut: true, isSigner: false },
        { name: "seller", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "x402Verify",
      accounts: [
        { name: "paymentLink", isMut: false, isSigner: false },
        { name: "requester", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "updateConfig",
      accounts: [
        { name: "config", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [
        { name: "feeBps", type: { option: "u16" } },
        { name: "treasury", type: { option: "publicKey" } },
        { name: "isPaused", type: { option: "bool" } },
      ],
    },
  ],
  accounts: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "bump", type: "u8" },
          { name: "authority", type: "publicKey" },
          { name: "isActive", type: "bool" },
          { name: "isPaused", type: "bool" },
          { name: "feeBps", type: "u16" },
          { name: "treasury", type: "publicKey" },
          { name: "version", type: "u8" },
          { name: "totalLinks", type: "u64" },
          { name: "totalVolume", type: "u64" },
        ],
      },
    },
    {
      name: "PaymentLink",
      type: {
        kind: "struct",
        fields: [
          { name: "bump", type: "u8" },
          { name: "seller", type: "publicKey" },
          { name: "mint", type: "publicKey" },
          { name: "amount", type: "u64" },
          { name: "description", type: "string" },
          { name: "isActive", type: "bool" },
          { name: "isPaid", type: "bool" },
          { name: "isSettled", type: "bool" },
          { name: "isX402", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "linkId", type: "u64" },
          { name: "buyer", type: "publicKey" },
          { name: "paidAt", type: "i64" },
          { name: "config", type: "publicKey" },
          { name: "expiresAt", type: "i64" },
        ],
      },
    },
  ],
  events: [
    {
      name: "PaymentLinkCreated",
      fields: [
        { name: "linkId", type: "u64", index: false },
        { name: "seller", type: "publicKey", index: false },
        { name: "amount", type: "u64", index: false },
        { name: "mint", type: "publicKey", index: false },
        { name: "isX402", type: "bool", index: false },
        { name: "expiresAt", type: "i64", index: false },
        { name: "description", type: "string", index: false },
      ],
    },
    {
      name: "PaymentReceived",
      fields: [
        { name: "linkId", type: "u64", index: false },
        { name: "seller", type: "publicKey", index: false },
        { name: "buyer", type: "publicKey", index: false },
        { name: "amount", type: "u64", index: false },
        { name: "paidAt", type: "i64", index: false },
      ],
    },
    {
      name: "PaymentSettled",
      fields: [
        { name: "linkId", type: "u64", index: false },
        { name: "seller", type: "publicKey", index: false },
        { name: "buyer", type: "publicKey", index: false },
        { name: "sellerAmount", type: "u64", index: false },
        { name: "fee", type: "u64", index: false },
        { name: "settledAt", type: "i64", index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "MathOverflow", msg: "Math overflow" },
    { code: 6001, name: "DivisionByZero", msg: "Division by zero" },
    { code: 6002, name: "InsufficientFunds", msg: "Insufficient funds" },
    { code: 6003, name: "Unauthorized", msg: "Unauthorized" },
    { code: 6004, name: "InactiveAccount", msg: "Account is inactive" },
    { code: 6005, name: "ConfigInactive", msg: "Config is inactive or paused" },
    { code: 6006, name: "InvalidAmount", msg: "Invalid amount" },
    { code: 6007, name: "InvalidParameter", msg: "Invalid parameter" },
    { code: 6008, name: "InvalidFee", msg: "Invalid fee" },
    { code: 6009, name: "InvalidMint", msg: "Invalid mint" },
    { code: 6010, name: "InvalidOwner", msg: "Invalid owner" },
    { code: 6011, name: "AlreadyPaid", msg: "Already paid" },
    { code: 6012, name: "NotPaid", msg: "Not paid yet" },
    { code: 6013, name: "AlreadySettled", msg: "Already settled" },
    { code: 6014, name: "NotX402Link", msg: "Not an x402 link" },
    { code: 6015, name: "InvalidExpiry", msg: "Invalid expiry timestamp" },
    { code: 6016, name: "LinkExpired", msg: "Payment link has expired" },
    { code: 6017, name: "NoExpiry", msg: "Link has no expiry set" },
    { code: 6018, name: "NotExpiredYet", msg: "Link has not expired yet" },
  ],
} as const;

export type PaymentLinkAccount = {
  bump: number;
  seller: import("@solana/web3.js").PublicKey;
  mint: import("@solana/web3.js").PublicKey;
  amount: import("bn.js");
  description: string;
  isActive: boolean;
  isPaid: boolean;
  isSettled: boolean;
  isX402: boolean;
  createdAt: import("bn.js");
  linkId: import("bn.js");
  buyer: import("@solana/web3.js").PublicKey;
  paidAt: import("bn.js");
  config: import("@solana/web3.js").PublicKey;
  expiresAt: import("bn.js");
};
