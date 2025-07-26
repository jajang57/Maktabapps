import React, { useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import ListSubheader from "@mui/material/ListSubheader";

export default function TanggalTreeFilter({ rows, value, onChange }) {
  // Ambil semua tanggal unik, urutkan, dan group by tahun-bulan
  // Build options + group info
  const tanggalOptions = useMemo(() => {
    const arr = Array.from(new Set(rows.map(r => r.tanggal))).filter(Boolean).sort();
    return arr.map(tgl => {
      const [year, month, day] = tgl.split("-");
      return {
        label: tgl,
        value: tgl,
        group: `${year} - ${new Date(year, month - 1).toLocaleString("default", { month: "long" })}`,
        year,
        month,
        day
      };
    });
  }, [rows]);

  // Helper: group -> semua tanggal di group tsb
  const groupToTanggal = useMemo(() => {
    const map = {};
    tanggalOptions.forEach(opt => {
      if (!map[opt.group]) map[opt.group] = [];
      map[opt.group].push(opt.value);
    });
    return map;
  }, [tanggalOptions]);

  // Handle change biasa
  const handleChange = (_, newValue) => {
    onChange(newValue.map(opt => opt.value));
  };

  // Custom render group header: klik header = select all tanggal di group tsb
  const StyledListSubheader = styled(ListSubheader)({
    cursor: 'pointer',
    fontWeight: 600,
    background: '#f5f5f5',
    '&:hover': { background: '#e0e0e0' }
  });

  const renderGroup = (params) => (
    <StyledListSubheader
      key={params.key}
      onClick={e => {
        e.stopPropagation();
        // Toggle: jika semua tanggal di group sudah terpilih, maka unselect semua, else select all
        const allVals = groupToTanggal[params.group];
        const isAllSelected = allVals.every(val => value.includes(val));
        let newVals;
        if (isAllSelected) {
          newVals = value.filter(val => !allVals.includes(val));
        } else {
          newVals = Array.from(new Set([...value, ...allVals]));
        }
        onChange(newVals);
      }}
      component="div"
    >
      {params.group}
    </StyledListSubheader>
  );

  return (
    <Autocomplete
      multiple
      options={tanggalOptions}
      getOptionLabel={opt => opt.label}
      groupBy={opt => opt.group}
      value={tanggalOptions.filter(opt => value.includes(opt.value))}
      onChange={handleChange}
      renderGroup={renderGroup}
      renderInput={params => (
        <TextField {...params} label="Filter Tanggal" placeholder="Pilih Tanggal" size="small" />
      )}
      style={{ minWidth: 200 }}
    />
  );
}
