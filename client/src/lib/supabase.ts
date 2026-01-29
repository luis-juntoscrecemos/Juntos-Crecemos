import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let configPromise: Promise<{ supabaseUrl: string; supabaseAnonKey: string }> | null = null;
let isInitializing = false;

async function getConfig() {
  if (!configPromise) {
    configPromise = fetch('/api/config')
      .then(res => res.json())
      .catch(() => ({ supabaseUrl: '', supabaseAnonKey: '' }));
  }
  return configPromise;
}

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    if (supabaseClient) {
      return supabaseClient;
    }
  }

  isInitializing = true;
  const config = await getConfig();
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    isInitializing = false;
    throw new Error('Supabase configuration not available');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
  
  isInitializing = false;
  return supabaseClient;
}

// Export a proxy object that lazily initializes Supabase
export const supabase = {
  auth: {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const client = await getSupabaseClient();
      return client.auth.signUp({ email, password });
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const client = await getSupabaseClient();
      return client.auth.signInWithPassword({ email, password });
    },
    signOut: async () => {
      const client = await getSupabaseClient();
      return client.auth.signOut();
    },
    getSession: async () => {
      const client = await getSupabaseClient();
      return client.auth.getSession();
    },
    getUser: async () => {
      const client = await getSupabaseClient();
      return client.auth.getUser();
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      let subscription: { unsubscribe: () => void } | null = null;
      
      getSupabaseClient().then(client => {
        const { data } = client.auth.onAuthStateChange(callback);
        subscription = data.subscription;
      });

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              if (subscription) {
                subscription.unsubscribe();
              }
            }
          }
        }
      };
    }
  }
};

// Auth helpers
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// Get access token for API calls
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
