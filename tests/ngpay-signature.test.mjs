import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NGPAY_API_KEY = "111222";

const { buildNgPaySignContent, signNgPayData, verifyNgPayDataSign, formatNgPayAmount, parseNgPayAmount, pickNgPayCheckoutUrl } = await import("../src/lib/ngpay.js");

test("NG Pay signer matches the documented uppercase MD5 vector", () => {
  const data = {
    merchantNo: "NG2000",
    merchantOrderNo: "123456",
    amount: "100.00",
    coinUnit: "PKR",
    extend: "",
  };

  assert.equal(
    buildNgPaySignContent(data, "111222"),
    "amount=100.00&coinUnit=PKR&merchantNo=NG2000&merchantOrderNo=123456&key=111222"
  );
  assert.equal(signNgPayData(data, "111222"), "3829D149F2F5480328040170B90F1BE6");
});

test("callback verification dynamically includes all nonempty fields and ignores sign", () => {
  const callbackData = { merchantOrderNo: "123", status: 0, newField: "added", empty: "" };
  callbackData.sign = signNgPayData(callbackData, "111222");

  assert.equal(verifyNgPayDataSign(callbackData, "111222"), true);
  assert.equal(verifyNgPayDataSign({ ...callbackData, newField: "tampered" }, "111222"), false);
});

test("PKR amounts convert exactly between rupees and paisa", () => {
  assert.equal(parseNgPayAmount("100.25"), 10025);
  assert.equal(formatNgPayAmount(10025), "100.25");
  assert.equal(parseNgPayAmount("1.234"), null);
});

test("checkout URL is taken from the first http(s) field NG Pay returns", () => {
  assert.equal(pickNgPayCheckoutUrl({ payUrl: "https://pay.example/c/1" }), "https://pay.example/c/1");
  assert.equal(pickNgPayCheckoutUrl({ payData: "https://pay.example/c/2", orderNo: "9" }), "https://pay.example/c/2");
  assert.equal(pickNgPayCheckoutUrl({ payUrl: "", url: "javascript:alert(1)" }), null);
});
