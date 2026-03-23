import { getEnv } from './env';

type SelectOptions = {
  select?: string;
  filters?: string[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
  count?: 'exact';
};

function getBaseUrl() {
  return `${getEnv().NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
}

export function eq(column: string, value: string | number | boolean) {
  return `${column}=eq.${value}`;
}

export function lte(column: string, value: string | number) {
  return `${column}=lte.${value}`;
}

export function inList(column: string, values: string[]) {
  return `${column}=in.(${values.join(',')})`;
}

export function rawFilter(filter: string) {
  return filter;
}

class SupabaseRestClient {
  constructor(private readonly apiKey: string) {}

  private headers(extra?: HeadersInit): HeadersInit {
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }

  private buildUrl(table: string, options: SelectOptions = {}) {
    const url = new URL(`${getBaseUrl()}/${table}`);

    if (options.select) {
      url.searchParams.set('select', options.select);
    }

    for (const filter of options.filters ?? []) {
      const separatorIndex = filter.indexOf('=');
      if (separatorIndex === -1) continue;
      const key = filter.slice(0, separatorIndex);
      const value = filter.slice(separatorIndex + 1);
      url.searchParams.append(key, value);
    }

    if (options.order) {
      url.searchParams.set('order', `${options.order.column}.${options.order.ascending === false ? 'desc' : 'asc'}`);
    }

    if (options.limit) {
      url.searchParams.set('limit', String(options.limit));
    }

    return url.toString();
  }

  async select<T>(table: string, options: SelectOptions = {}) {
    const response = await fetch(this.buildUrl(table, options), {
      headers: this.headers(options.count ? { Prefer: `count=${options.count}` } : undefined),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const countHeader = response.headers.get('content-range');
    const count = countHeader?.split('/')[1];

    return {
      data: (await response.json()) as T[],
      count: count ? Number(count) : null
    };
  }

  async maybeSingle<T>(table: string, options: SelectOptions = {}) {
    const response = await fetch(this.buildUrl(table, { ...options, limit: 1 }), {
      headers: this.headers(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as T[];
    return data[0] ?? null;
  }

  async single<T>(table: string, options: SelectOptions = {}) {
    const data = await this.maybeSingle<T>(table, options);
    if (!data) {
      throw new Error('Not found');
    }

    return data;
  }

  async insert<T>(table: string, payload: Record<string, unknown> | Record<string, unknown>[]) {
    const response = await fetch(this.buildUrl(table), {
      method: 'POST',
      headers: this.headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as T[];
  }

  async update<T>(table: string, payload: Record<string, unknown>, filters: string[]) {
    const response = await fetch(this.buildUrl(table, { filters }), {
      method: 'PATCH',
      headers: this.headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as T[];
  }
}

export function createSupabaseAdminClient() {
  return new SupabaseRestClient(getEnv().SUPABASE_SERVICE_ROLE_KEY);
}
