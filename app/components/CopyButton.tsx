"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn btn-ghost btn-sm"
      style={{ flexShrink: 0 }}
    >
      {copied ? "✓ Copied!" : "Copy link"}
    </button>
  );
}
