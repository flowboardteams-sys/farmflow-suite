import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

const FARM_KEY = "sfm:active_farm_id";
const LOC_KEY = "sfm:active_location_id";

type Farm = { id: string; name: string; logo_url: string | null; owner_id: string };
type Location = { id: string; name: string; is_primary: boolean; farm_id: string };

type Ctx = {
  farms: Farm[];
  farm: Farm | null;
  locations: Location[];
  location: Location | null;
  setFarmId: (id: string) => void;
  setLocationId: (id: string) => void;
  loading: boolean;
};

const FarmCtx = createContext<Ctx | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [farmId, setFarmIdState] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(FARM_KEY) : null,
  );
  const [locationId, setLocationIdState] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(LOC_KEY) : null,
  );

  const farmsQ = useQuery({
    queryKey: ["farms", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Farm[]> => {
      const { data, error } = await supabase
        .from("farms")
        .select("id,name,logo_url,owner_id")
        .is("deleted_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const locsQ = useQuery({
    queryKey: ["farm_locations", farmId],
    enabled: !!farmId,
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from("farm_locations")
        .select("id,name,is_primary,farm_id")
        .eq("farm_id", farmId!)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Auto-select first farm/location
  useEffect(() => {
    if (!farmsQ.data?.length) return;
    if (!farmId || !farmsQ.data.find((f) => f.id === farmId)) {
      setFarmId(farmsQ.data[0].id);
    }
  }, [farmsQ.data, farmId]);

  useEffect(() => {
    if (!locsQ.data?.length) return;
    if (!locationId || !locsQ.data.find((l) => l.id === locationId)) {
      setLocationId(locsQ.data[0].id);
    }
  }, [locsQ.data, locationId]);

  function setFarmId(id: string) {
    setFarmIdState(id);
    localStorage.setItem(FARM_KEY, id);
    setLocationIdState(null);
    localStorage.removeItem(LOC_KEY);
    qc.invalidateQueries();
  }
  function setLocationId(id: string) {
    setLocationIdState(id);
    localStorage.setItem(LOC_KEY, id);
    qc.invalidateQueries();
  }

  const value = useMemo<Ctx>(
    () => ({
      farms: farmsQ.data ?? [],
      farm: farmsQ.data?.find((f) => f.id === farmId) ?? null,
      locations: locsQ.data ?? [],
      location: locsQ.data?.find((l) => l.id === locationId) ?? null,
      setFarmId,
      setLocationId,
      loading: farmsQ.isLoading,
    }),
    [farmsQ.data, locsQ.data, farmId, locationId, farmsQ.isLoading],
  );

  return <FarmCtx.Provider value={value}>{children}</FarmCtx.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmCtx);
  if (!ctx) throw new Error("useFarm must be used inside FarmProvider");
  return ctx;
}
