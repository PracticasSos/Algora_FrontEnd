// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../api/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSyncUser = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // 1) Buscar por auth_id
      let { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetch users:", fetchError);
      }

      // 2) Si no hay usuario, fallback por email
      if (!dbUser && authUser.email) {
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (emailError) {
          console.error("Error buscando usuario por email:", emailError);
        }

        if (userByEmail) {
          // Vincular auth_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_id: authUser.id })
            .eq('id', userByEmail.id);

          if (updateError) {
            console.error("Error vinculando auth_id:", updateError);
          }

          dbUser = { ...userByEmail, auth_id: authUser.id };
        }
      }

      if (!dbUser) {
        console.warn("Usuario no encontrado en tabla users:", authUser.email);
        setUser(null);
        setLoading(false);
        return;
      }

      // 3) Validar tenant_id
      const tenantInJWT = authUser.user_metadata?.tenant_id;
      if (!tenantInJWT || tenantInJWT !== dbUser.tenant_id) {
        console.log("Tenant_id faltante o incorrecto en JWT. Corrigiendo...");
        const { error: updateError } = await supabase.auth.updateUser({
          data: { tenant_id: dbUser.tenant_id }
        });

        if (updateError) {
          console.error("Error actualizando tenant_id en metadata:", updateError);
        } else {
          console.log("Tenant_id actualizado. Refrescando sesión...");
          await supabase.auth.refreshSession();
          return;
        }
      }

      // 4) Guardar usuario fusionado
      const fullUserData = { ...authUser, ...dbUser };
      setUser(fullUserData);
      localStorage.setItem('user', JSON.stringify(fullUserData));

    } catch (err) {
      console.error("Error sincronizando usuario:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchAndSyncUser(session?.user || null);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndSyncUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
