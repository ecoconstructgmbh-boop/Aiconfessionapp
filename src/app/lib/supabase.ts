import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  city: string;
  language: string;
  karma: number;
}

// Save user profile to KV store
export async function saveUserProfile(userId: string, profile: UserProfile) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-ed36fee5/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error('Failed to save profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

// Get user profile from KV store
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-ed36fee5/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Profile doesn't exist yet, return default
        return {
          firstName: '',
          lastName: '',
          city: '',
          language: 'Русский',
          karma: 0,
        };
      }
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      firstName: '',
      lastName: '',
      city: '',
      language: 'Русский',
      karma: 0,
    };
  }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
  
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  // First, auto-confirm email if needed
  try {
    await fetch(`${supabaseUrl}/functions/v1/make-server-ed36fee5/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    console.log('Pre-signin check failed, continuing with login attempt:', error);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
  
  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  // Use server endpoint to bypass rate limiting
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-ed36fee5/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }

    // After successful signup, sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Error signing in after signup:', signInError);
      throw signInError;
    }

    return signInData;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  if (!session?.user) {
    return null;
  }
  
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || 'Пользователь',
    avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
  };
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || 'Пользователь',
        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      };
      callback(user);
    } else {
      callback(null);
    }
  });
}