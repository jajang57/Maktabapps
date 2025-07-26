import React from "react";
import IconButton from "@mui/material/IconButton";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import SimpleDropdownFilter from "./SimpleDropdownFilter";

export default function SimpleDropdownFilterButton({
  filterType,
  options = [],
  value,
  onChange,
  placeholder,
  iconTitle = "Filter",
  minWidth,
  maxHeight,
}) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef();
  const isActive = filterType === 'text' ? !!value : (value && value.length > 0);
  return (
    <>
      <IconButton
        size="small"
        ref={anchorRef}
        onClick={() => setOpen(!open)}
        style={{ padding: 4, background: isActive ? '#e3f0ff' : undefined, color: isActive ? '#1976d2' : undefined }}
        title={iconTitle}
      >
        <FilterListIcon fontSize="small" />
      </IconButton>
      {open && (
        <div style={{ position: 'absolute', zIndex: 9999, top: 24, right: 0 }}>
          <ClickAwayListener onClickAway={() => setOpen(false)}>
            <div>
              <SimpleDropdownFilter
                type={filterType}
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                minWidth={minWidth}
                maxHeight={maxHeight}
              />
            </div>
          </ClickAwayListener>
        </div>
      )}
    </>
  );
}
