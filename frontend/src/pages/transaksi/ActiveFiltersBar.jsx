import React from "react";
import { Chip, Box, Typography, Button } from "@mui/material";

const ActiveFiltersBar = ({
  tanggalFilter = [],
  noBuktiFilter = [],
  akunFilter = [],
  keteranganFilter = "",
  statusPostingFilter = [],
  onRemove,
  onReset,
}) => {
  // Gabungkan semua filter aktif ke dalam satu array chip
  const chips = [];
  tanggalFilter.forEach(tgl => chips.push({ label: tgl, type: "tanggal", value: tgl }));
  noBuktiFilter.forEach(nb => chips.push({ label: nb, type: "noBukti", value: nb }));
  akunFilter.forEach(akun => chips.push({ label: akun, type: "akun", value: akun }));
  if (keteranganFilter && keteranganFilter.trim() !== "") {
    chips.push({ label: keteranganFilter, type: "keterangan", value: keteranganFilter });
  }
  statusPostingFilter.forEach(st => {
    chips.push({ label: st === "posted" ? "Sudah Posting" : "Belum Posting", type: "status", value: st });
  });

  if (chips.length === 0) return null;

  return (
    <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', maxWidth: 900 }}>
      <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mr: 1 }}>Filter Aktif:</Typography>
      {chips.map((chip, idx) => (
        <Chip
          key={chip.type + chip.value + idx}
          label={chip.label}
          size="small"
          onDelete={() => onRemove(chip)}
          sx={{ bgcolor: '#e3f0ff', color: '#1976d2', fontWeight: 500 }}
        />
      ))}
      {onReset && (
        <Button size="small" variant="outlined" color="primary" sx={{ ml: 2, fontSize: 12, py: 0.2, px: 1, minWidth: 0, height: 28 }} onClick={onReset}>
          Reset Filter
        </Button>
      )}
    </Box>
  );
};

export default ActiveFiltersBar;
