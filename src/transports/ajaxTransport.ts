import type { Transport } from "../types";

type AjaxSuccessCallback = (response: unknown) => void;
type AjaxErrorCallback = (error: unknown) => void;

export type LegacyAjaxFn = (
  wsfilename: string,
  data?: Record<string, unknown>,
  successCallback?: AjaxSuccessCallback,
  errorCallback?: AjaxErrorCallback,
  type?: "post" | "get",
  async?: boolean,
  custom?: boolean,
) => void;

interface CreateAjaxTransportOptions {
  ajax: LegacyAjaxFn;
  requestType?: "post" | "get";
  async?: boolean;
  custom?: boolean;
  parseJsonResponse?: boolean;
}

export function createAjaxTransport(options: CreateAjaxTransportOptions): Transport {
  const {
    ajax,
    requestType = "post",
    async = true,
    custom = true,
    parseJsonResponse = true,
  } = options;

  return ({ url, body = {} }) =>
    new Promise((resolve, reject) => {
      ajax(
        url,
        body,
        (response) => {
          if (!parseJsonResponse || typeof response !== "string") {
            resolve(response);
            return;
          }

          try {
            resolve(JSON.parse(response));
          } catch {
            resolve(response);
          }
        },
        (error) => reject(error),
        requestType,
        async,
        custom,
      );
    });
}
