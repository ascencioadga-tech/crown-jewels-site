"use client";

import { useEffect, useState } from "react";
import { CommoditySize } from "./data";

export interface ProductConfig {
  hiddenCommodities: string[];          // commodity IDs hidden
  hiddenSizes: string[];                // size keys "id__index" hidden
  customSizes: Record<string, CommoditySize[]>; // commodityId -> additional sizes
}

const KEY = "cj_product_config";

const defaultConfig: ProductConfig = {
  hiddenCommodities: [],
  hiddenSizes: [],
  customSizes: {},
};

export function useProductConfig() {
  const [config, setConfig] = useState<ProductConfig>(defaultConfig);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setConfig({ ...defaultConfig, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(config));
    } catch {}
  }, [config, hydrated]);

  const toggleCommodity = (id: string) => {
    setConfig((c) => ({
      ...c,
      hiddenCommodities: c.hiddenCommodities.includes(id)
        ? c.hiddenCommodities.filter((x) => x !== id)
        : [...c.hiddenCommodities, id],
    }));
  };

  const toggleSize = (sizeKey: string) => {
    setConfig((c) => ({
      ...c,
      hiddenSizes: c.hiddenSizes.includes(sizeKey)
        ? c.hiddenSizes.filter((x) => x !== sizeKey)
        : [...c.hiddenSizes, sizeKey],
    }));
  };

  const addCustomSize = (commodityId: string, size: CommoditySize) => {
    setConfig((c) => ({
      ...c,
      customSizes: {
        ...c.customSizes,
        [commodityId]: [...(c.customSizes[commodityId] || []), size],
      },
    }));
  };

  const removeCustomSize = (commodityId: string, index: number) => {
    setConfig((c) => {
      const list = c.customSizes[commodityId] || [];
      const next = list.filter((_, i) => i !== index);
      const customSizes = { ...c.customSizes };
      if (next.length === 0) {
        delete customSizes[commodityId];
      } else {
        customSizes[commodityId] = next;
      }
      return { ...c, customSizes };
    });
  };

  const reset = () => setConfig(defaultConfig);

  return {
    config,
    hydrated,
    toggleCommodity,
    toggleSize,
    addCustomSize,
    removeCustomSize,
    reset,
  };
}
