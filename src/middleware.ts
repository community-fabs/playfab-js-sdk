
export type RequestContext = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
};

export type ResponseContext<T = any> = {
  response: Response;
  data?: T;
};

export type RequestMiddleware = (
  ctx: RequestContext,
  next: (ctx: RequestContext) => Promise<ResponseContext>
) => Promise<ResponseContext>;

export function compose(middleware: RequestMiddleware[]) {
  return async function run(ctx: RequestContext): Promise<ResponseContext> {
    let index = -1;

    async function dispatch(i: number): Promise<ResponseContext> {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;

      const mw = middleware[i];

      if (!mw) {
        // Final handler (fetch)
        const res = await fetch(ctx.url, {
          method: ctx.method,
          headers: ctx.headers,
          body: ctx.body ? JSON.stringify(ctx.body) : undefined,
        });

        const data = await res.json().catch(() => undefined);
        return { response: res, data };
      }

      return mw(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}