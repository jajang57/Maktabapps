import React from "react";
import IconButton from "@mui/material/IconButton";
import FilterListIcon from "@mui/icons-material/FilterList";
import TanggalDropdownCustom from "./TanggalDropdownCustom";
import ClickAwayListener from '@mui/material/ClickAwayListener';

export default function TanggalDropdownCustomButton(props) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef();
  return (
    <>
      <IconButton
        size="small"
        ref={anchorRef}
        onClick={() => setOpen(!open)}
        style={{ padding: 4, background: (props.value && props.value.length > 0) ? '#e3f0ff' : undefined, color: (props.value && props.value.length > 0) ? '#1976d2' : undefined }}
        title="Filter Tanggal"
      >
        <FilterListIcon fontSize="small" />
      </IconButton>
      {open && (
        <div style={{ position: 'absolute', zIndex: 9999, top: 24, right: 0 }}>
          <ClickAwayListener onClickAway={() => setOpen(false)}>
            <div>
              <TanggalDropdownCustom
                {...props}
                anchorEl={anchorRef.current}
                forceOpen={open}
                onRequestClose={() => setOpen(false)}
                hideInput={true}
              />
            </div>
          </ClickAwayListener>
        </div>
      )}
    </>
  );
}
