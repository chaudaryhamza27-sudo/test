import mongoose from "mongoose";
import fs from "fs";
const envText = fs.readFileSync(new URL("./.env.local", import.meta.url), "utf8");
const uriLine = envText.split("\n").find((l) => l.startsWith("MONGODB_URI="));
const uri = uriLine.slice("MONGODB_URI=".length).trim();
const conn = await mongoose.createConnection(uri).asPromise();
const MethodSchema = new mongoose.Schema({ key: String, label: String, enabled: Boolean }, { _id: true });
const SupportSettingsSchema = new mongoose.Schema({ withdrawMethods: [MethodSchema] }, { strict: false });
const SupportSettings = conn.model("SupportSettings", SupportSettingsSchema);
await SupportSettings.updateOne(
  { "withdrawMethods.key": "easypaisa" },
  { $set: { "withdrawMethods.$.enabled": true } }
);
await SupportSettings.updateOne(
  { "withdrawMethods.key": "jazzcash" },
  { $set: { "withdrawMethods.$.enabled": true } }
);
const after = await SupportSettings.findOne().lean();
console.log(JSON.stringify(after.withdrawMethods));
await conn.close();
