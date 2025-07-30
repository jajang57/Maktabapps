import React, { useMemo, useState } from "react";
import { Button, Popover, Checkbox, List, ListItem, ListItemText, ListSubheader, Collapse, Box } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

export default function TanggalDropdownCustom({ rows, value, onChange, hideInput }) {
  // Group data: tahun > bulan > tanggal
  const tree = useMemo(() => {
    const map = {};
    rows.forEach(row => {
      if (!row.tanggal) return;
      let year, month, day;
      if (typeof row.tanggal === "string") {
        // Jika string, coba split
        const parts = row.tanggal.split("-");
        if (parts.length === 3) {
          [year, month, day] = parts;
        } else {
          // fallback: parse string ke Date
          const d = new Date(row.tanggal);
          if (isNaN(d.getTime())) return;
          year = String(d.getFullYear());
          month = String(d.getMonth() + 1).padStart(2, "0");
          day = String(d.getDate()).padStart(2, "0");
        }
      } else if (row.tanggal instanceof Date && !isNaN(row.tanggal.getTime())) {
        year = String(row.tanggal.getFullYear());
        month = String(row.tanggal.getMonth() + 1).padStart(2, "0");
        day = String(row.tanggal.getDate()).padStart(2, "0");
      } else {
        return;
      }
      if (!map[year]) map[year] = {};
      if (!map[year][month]) map[year][month] = [];
      if (!map[year][month].includes(day)) map[year][month].push(day);
    });
    return map;
  }, [rows]);

  // State for popover and expand/collapse
  const [anchorEl, setAnchorEl] = useState(null);
  const [openYear, setOpenYear] = useState({});
  const [openMonth, setOpenMonth] = useState({});

  // Helpers
  const isChecked = (tgl) => value.includes(tgl);
  const isMonthAllChecked = (year, month) => tree[year][month].every(day => isChecked(`${year}-${month}-${day}`));
  const isYearAllChecked = (year) => Object.keys(tree[year]).every(month => isMonthAllChecked(year, month));

  // Handlers
  const handleToggleTgl = (tgl) => {
    if (isChecked(tgl)) {
      onChange(value.filter(v => v !== tgl));
    } else {
      onChange([...value, tgl]);
    }
  };
  const handleToggleMonth = (year, month) => {
    const allTgl = tree[year][month].map(day => `${year}-${month}-${day}`);
    if (isMonthAllChecked(year, month)) {
      onChange(value.filter(v => !allTgl.includes(v)));
    } else {
      onChange(Array.from(new Set([...value, ...allTgl])));
    }
  };
  const handleToggleYear = (year) => {
    let allTgl = [];
    Object.entries(tree[year]).forEach(([month, days]) => {
      allTgl = allTgl.concat(days.map(day => `${year}-${month}-${day}`));
    });
    if (isYearAllChecked(year)) {
      onChange(value.filter(v => !allTgl.includes(v)));
    } else {
      onChange(Array.from(new Set([...value, ...allTgl])));
    }
  };
  const handleChange = (selected) => {
    // selected: array of Date or string
    const formatted = selected
      .map(tgl => {
        const d = new Date(tgl);
        if (isNaN(d.getTime())) return "";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      })
      .filter(Boolean);
    onChange(formatted);
  };

  // UI
  if (hideInput) {
    return (
      <Box sx={{
        maxHeight: 340,
        minWidth: 210,
        bgcolor: '#fff',
        borderRadius: 2,
        boxShadow: 3,
        p: 1,
        overflow: 'auto',
        border: '1px solid #e0e0e0',
      }}>
        <List disablePadding sx={{ pr: 0.5 }}>
          {Object.keys(tree).sort().map(year => (
            <React.Fragment key={year}>
              <ListSubheader
                component="div"
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  px: 0.5,
                  py: 0.2,
                  fontWeight: 600,
                  fontSize: 13.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5faff' },
                  display: 'flex', alignItems: 'center',
                  minHeight: 28,
                }}
                onClick={() => setOpenYear(y => ({ ...y, [year]: !y[year] }))}
              >
                <Checkbox
                  checked={isYearAllChecked(year)}
                  indeterminate={!isYearAllChecked(year) && Object.keys(tree[year]).some(month => isMonthAllChecked(year, month))}
                  onClick={e => { e.stopPropagation(); handleToggleYear(year); }}
                  size="small"
                  sx={{ mr: 0.5, p: 0.5 }}
                />
                {year} {openYear[year] ? <ExpandLess /> : <ExpandMore />}
              </ListSubheader>
              <Collapse in={!!openYear[year]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {Object.keys(tree[year]).sort().map(month => (
                    <React.Fragment key={month}>
                      <ListSubheader
                        component="div"
                        disableSticky
                        sx={{
                          pl: 2.5,
                          bgcolor: 'transparent',
                          cursor: 'pointer',
                          py: 0.2,
                          fontWeight: 500,
                          fontSize: 12.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: '#f5faff' },
                          display: 'flex', alignItems: 'center',
                          minHeight: 24,
                        }}
                        onClick={() => setOpenMonth(m => ({ ...m, [`${year}-${month}`]: !m[`${year}-${month}`] }))}
                      >
                        <Checkbox
                          checked={isMonthAllChecked(year, month)}
                          indeterminate={!isMonthAllChecked(year, month) && tree[year][month].some(day => isChecked(`${year}-${month}-${day}`))}
                          onClick={e => { e.stopPropagation(); handleToggleMonth(year, month); }}
                          size="small"
                          sx={{ mr: 0.5, p: 0.5 }}
                        />
                        {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {openMonth[`${year}-${month}`] ? <ExpandLess /> : <ExpandMore />}
                      </ListSubheader>
                      <Collapse in={!!openMonth[`${year}-${month}`]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {tree[year][month].sort().map(day => {
                            const tglVal = `${year}-${month}-${day}`;
                            return (
                              <ListItem
                                key={day}
                                sx={{
                                  pl: 5.5,
                                  cursor: 'pointer',
                                  borderRadius: 1,
                                  '&:hover': { bgcolor: '#f5faff' },
                                  my: 0.1,
                                  minHeight: 24,
                                }}
                                dense
                                button
                                onClick={() => handleToggleTgl(tglVal)}
                              >
                                <Checkbox
                                  checked={isChecked(tglVal)}
                                  tabIndex={-1}
                                  disableRipple
                                  size="small"
                                  sx={{ mr: 0.5, p: 0.5 }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleToggleTgl(tglVal);
                                  }}
                                />
                                <ListItemText primary={tglVal} primaryTypographyProps={{ fontSize: 12 }} />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  }
  // Default: show button and popover
  return (
    <div>
      <Button variant="outlined" onClick={e => setAnchorEl(e.currentTarget)} style={{ minWidth: 200 }}>
        {value.length === 0 ? "Pilih Tanggal" : `${value.length} tanggal dipilih`}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ maxHeight: 400, minWidth: 300, overflow: "auto", p: 1 }}>
          <List>
            {Object.keys(tree).sort().map(year => (
              <React.Fragment key={year}>
                <ListSubheader component="div" disableSticky sx={{ bgcolor: "#f5f5f5", cursor: "pointer" }} onClick={() => setOpenYear(y => ({ ...y, [year]: !y[year] }))}>
                  <Checkbox
                    checked={isYearAllChecked(year)}
                    indeterminate={!isYearAllChecked(year) && Object.keys(tree[year]).some(month => isMonthAllChecked(year, month))}
                    onClick={e => { e.stopPropagation(); handleToggleYear(year); }}
                  />
                  {year} {openYear[year] ? <ExpandLess /> : <ExpandMore />}
                </ListSubheader>
                <Collapse in={!!openYear[year]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {Object.keys(tree[year]).sort().map(month => (
                      <React.Fragment key={month}>
                        <ListSubheader component="div" disableSticky sx={{ pl: 4, bgcolor: "#fafafa", cursor: "pointer" }} onClick={() => setOpenMonth(m => ({ ...m, [`${year}-${month}`]: !m[`${year}-${month}`] }))}>
                          <Checkbox
                            checked={isMonthAllChecked(year, month)}
                            indeterminate={!isMonthAllChecked(year, month) && tree[year][month].some(day => isChecked(`${year}-${month}-${day}`))}
                            onClick={e => { e.stopPropagation(); handleToggleMonth(year, month); }}
                          />
                          {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {openMonth[`${year}-${month}`] ? <ExpandLess /> : <ExpandMore />}
                        </ListSubheader>
                        <Collapse in={!!openMonth[`${year}-${month}`]} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {tree[year][month].sort().map(day => {
                              const tglVal = `${year}-${month}-${day}`;
                              return (
                                <ListItem
                                  key={day}
                                  sx={{ pl: 8, cursor: 'pointer' }}
                                  dense
                                  button
                                  onClick={() => handleToggleTgl(tglVal)}
                                >
                                  <Checkbox
                                    checked={isChecked(tglVal)}
                                    tabIndex={-1}
                                    disableRipple
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleToggleTgl(tglVal);
                                    }}
                                  />
                                  <ListItemText primary={tglVal} />
                                </ListItem>
                              );
                            })}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Popover>
    </div>
  );
}
