"use client";

import { useState } from "react";
import { IconCopy } from "../icons";

const STATUS_LABELS = {
  approved: "Completed",
  completed: "Completed",
  rejected: "Rejected",
  pending: "Pending",
};

const TYPE_LABELS = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  game_bet: "Game bet",
  game_win: "Game win",
};

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function TransactionHistoryCard({ transaction }) {
  const [copied, setCopied] = useState(false);
  const typeLabel = TYPE_LABELS[transaction.type] || transaction.type;
  const status = STATUS_LABELS[transaction.status] || transaction.status || "Pending";
  const isComplete = transaction.status === "approved" || transaction.status === "completed";
  const outgoing = transaction.type === "withdraw" || transaction.type === "game_bet";
  const orderNumber = transaction.orderNumber || String(transaction._id || "");

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // The reference remains selectable if the Clipboard API is unavailable.
    }
  };

  return (
    <article className="transaction-history-card">
      <div className="transaction-history-card-head">
        <span className={`transaction-history-type ${transaction.type}`}>{typeLabel}</span>
        <span className={`transaction-history-status ${isComplete ? "complete" : transaction.status}`}>{status}</span>
      </div>

      <dl className="transaction-history-details">
        <div>
          <dt>Balance</dt>
          <dd className={outgoing ? "outgoing" : "incoming"}>{outgoing ? "-" : "+"}Rs{Number(transaction.amount).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{transaction.method || typeLabel}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatDate(transaction.createdAt)}</dd>
        </div>
        <div>
          <dt>Order number</dt>
          <dd className="transaction-order-number">
            <span title={orderNumber}>{orderNumber}</span>
            <button type="button" onClick={copyOrderNumber} aria-label="Copy order number" title="Copy order number">
              <IconCopy />
            </button>
            {copied && <small role="status">Copied</small>}
          </dd>
        </div>
      </dl>
    </article>
  );
}
