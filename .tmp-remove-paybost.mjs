import mongoose from "mongoose";
import fs from "fs";
const envText = fs.readFileSync(new URL("./.env.local", import.meta.url), "utf8");
const uriLine = envText.split("\n").find((l) => l.startsWith("MONGODB_URI="));
const uri = uriLine.slice("MONGODB_URI=".length).trim();
const conn = await mongoose.createConnection(uri).asPromise();

const MethodSchema = new mongoose.Schema({ key: String, label: String, enabled: Boolean }, { _id: true });
const SupportSettingsSchema = new mongoose.Schema(
  { methods: [MethodSchema], withdrawMethods: [MethodSchema] },
  { strict: false }
);
const SupportSettings = conn.model("SupportSettings", SupportSettingsSchema);

const before = await SupportSettings.findOne().lean();
console.log("BEFORE withdrawMethods:", JSON.stringify(before.withdrawMethods.map((m) => m.key)));
console.log("BEFORE methods (deposit, untouched):", JSON.stringify(before.methods.map((m) => m.key)));

// Only pull "paybost" from withdrawMethods — methods (deposit) stays as-is.
const result = await SupportSettings.updateOne({}, { $pull: { withdrawMethods: { key: "paybost" } } });
console.log("updateOne result:", JSON.stringify(result));

const after = await SupportSettings.findOne().lean();
console.log("AFTER withdrawMethods:", JSON.stringify(after.withdrawMethods.map((m) => m.key)));
console.log("AFTER methods (deposit, should be unchanged):", JSON.stringify(after.methods.map((m) => m.key)));

await conn.close();
