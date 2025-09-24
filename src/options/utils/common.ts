export async function fetchJSONAsObject<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const json: T = await response.json();
  return json;
}

export async function fetchHTMLAsFragment(url: string): Promise<DocumentFragment> {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const htmlText = await response.text();

  return document.createRange().createContextualFragment(htmlText);
}
