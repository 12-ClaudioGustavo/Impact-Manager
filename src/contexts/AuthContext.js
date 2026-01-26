import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  session: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(currentSession);

        if (currentSession) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', currentSession.user.id)
            .single();
          setProfile(userProfile || { subscription_tier: 'free' });
        }
      } catch (e) {
        console.error("Error fetching session/profile:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Reset profile on logout
        if (!session) setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  const value = {
    session,
    profile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
