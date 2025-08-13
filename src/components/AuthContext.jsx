import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      setUser(null);
      navigate('/login-form');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      setUser(null);
      navigate('/login-form');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          let { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, role_id, tenant_id, auth_id, email')
            .eq('auth_id', session.user.id)
            .single();

          // Si no encontró por auth_id, buscar por email y vincular
          if (!userData || userError) {
            const { data: userByEmail } = await supabase
              .from('users')
              .select('id, role_id, tenant_id, auth_id, email')
              .eq('email', session.user.email)
              .maybeSingle();

            if (userByEmail) {
              // Actualizar auth_id en la tabla
              await supabase
                .from('users')
                .update({ auth_id: session.user.id })
                .eq('id', userByEmail.id);

              userData = { ...userByEmail, auth_id: session.user.id };
            }
          }

          if (userData) {
            // Actualizar tenant_id en metadata si no está
            if (!session.user.user_metadata?.tenant_id && userData.tenant_id) {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { tenant_id: userData.tenant_id }
              });
              if (updateError) {
                console.error('Error actualizando tenant_id en metadata:', updateError);
              } else {
                await supabase.auth.refreshSession();
              }
            }

            const fullUser = { ...session.user, ...userData };
            setUser(fullUser);
            localStorage.setItem('user', JSON.stringify(fullUser));
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login-form');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
