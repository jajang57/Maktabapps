import React, { useState, useMemo } from "react";
import { Box, Checkbox, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";

// type: "text" | "multi-select" | "status"
// options: untuk multi-select/status, array of { label, value }
// value: tergantung type (array untuk multi-select/status, string untuk text)
export default function SimpleDropdownFilter({
  type = "text",
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  minWidth = 210,
  maxHeight = 340,
}) {
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(() => {
    if (type === "multi-select" || type === "status") {
      return options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      );
    }
    return [];
  }, [options, search, type]);

  return (
    <Box sx={{
      maxHeight,
      minWidth,
      bgcolor: '#fff',
      borderRadius: 2,
      boxShadow: 3,
      p: 1,
      overflow: 'auto',
      border: '1px solid #e0e0e0',
    }}>
      {type !== "status" && (
        <TextField
          size="small"
          placeholder={placeholder}
          value={type === "text" ? value : search}
          onChange={e => {
            if (type === "text") onChange(e.target.value);
            else setSearch(e.target.value);
          }}
          fullWidth
          sx={{ mb: 1, fontSize: 13 }}
          inputProps={{ style: { fontSize: 13, padding: 6 } }}
        />
      )}
      {(type === "multi-select" || type === "status") && (
        <List disablePadding sx={{ pr: 0.5 }}>
          {filteredOptions.map(opt => (
            <ListItem
              key={opt.value}
              dense
              button
              sx={{ borderRadius: 1, minHeight: 26, px: 1, my: 0.2, '&:hover': { bgcolor: '#f5faff' } }}
              onClick={() => {
                if (value.includes(opt.value)) {
                  onChange(value.filter(v => v !== opt.value));
                } else {
                  onChange([...value, opt.value]);
                }
              }}
            >
              <Checkbox
                checked={value.includes(opt.value)}
                size="small"
                sx={{ mr: 1, p: 0.5 }}
                tabIndex={-1}
                disableRipple
                onClick={e => {
                  e.stopPropagation();
                  if (value.includes(opt.value)) {
                    onChange(value.filter(v => v !== opt.value));
                  } else {
                    onChange([...value, opt.value]);
                  }
                }}
              />
              <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: 13 }} />
            </ListItem>
          ))}
          {filteredOptions.length === 0 && (
            <Typography variant="body2" sx={{ color: '#aaa', px: 1, py: 1, fontSize: 13 }}>No data</Typography>
          )}
        </List>
      )}
    </Box>
  );
}
