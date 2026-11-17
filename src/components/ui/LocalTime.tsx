"use client";

import { useEffect, useState } from "react";

export default function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(
      new Date(iso).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, [iso]);

  return <time dateTime={iso}>{text || "\u00A0"}</time>;
}