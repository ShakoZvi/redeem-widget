import type { Transport } from "../types";

export const defaultFetchTransport: Transport = async ({ url, method = "POST", body = {} }) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
