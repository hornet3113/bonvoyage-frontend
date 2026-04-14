"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export type UserProfile = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_name: string | null;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN';
};

export type Avatar = {
  avatar_id: number;
  name: string;
  image_url: string;
};

export function useUserProfile() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      const api = createApiClient(getToken);
      try {
        const json = await api.get<{ data?: UserProfile } & UserProfile>("/api/v1/users/me");
        setProfile(json.data ?? json);
      } catch {
        // no mostrar error al usuario, simplemente no carga el perfil
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  const fetchAvatars = useCallback(async () => {
    if (avatars.length > 0) return;
    const api = createApiClient(getToken);
    try {
      const json = await api.get<{ data?: Avatar[] } & Avatar[]>("/api/v1/avatars");
      setAvatars(json.data ?? json);
    } catch {
      // silently fail
    }
  }, [getToken, avatars.length]);

  const updateAvatar = useCallback(
    async (avatarId: number): Promise<boolean> => {
      setUpdating(true);
      const api = createApiClient(getToken);
      try {
        const json = await api.patch<{ data?: UserProfile } & UserProfile>(
          "/api/v1/users/me",
          { avatar_id: avatarId }
        );
        setProfile(json.data ?? json);
        return true;
      } catch {
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [getToken]
  );

  return { profile, avatars, loading, updating, fetchAvatars, updateAvatar };
}
