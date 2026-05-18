import { useState } from "react";

export const useCardSelection = (initializer, maxCount) => {
  const [selectedIds, setSelectedIds] = useState(initializer);

  const toggle = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((s) => s !== id);
      if (ids.length >= maxCount) return ids;
      return [...ids, id];
    });
  };

  return [selectedIds, toggle];
};

export const usePairedCardSelection = (maxTotal = 4) => {
  const [selectedHandIds, setSelectedHandIds] = useState([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);

  const selectedCount = selectedHandIds.length + selectedStorageIds.length;

  const toggleHand = (id) => {
    setSelectedHandIds((ids) => {
      if (ids.includes(id)) return ids.filter((s) => s !== id);
      if (selectedCount >= maxTotal) return ids;
      return [...ids, id];
    });
  };

  const toggleStorage = (id) => {
    setSelectedStorageIds((ids) => {
      if (ids.includes(id)) return ids.filter((s) => s !== id);
      if (selectedCount >= maxTotal) return ids;
      return [...ids, id];
    });
  };

  return { selectedHandIds, selectedStorageIds, selectedCount, toggleHand, toggleStorage };
};
