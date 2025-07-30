import React from "react";
import IconButton from "@mui/material/IconButton";
import FilterListIcon from "@mui/icons-material/FilterList";
import TanggalDropdownCustom from "./TanggalDropdownCustom";
import ClickAwayListener from '@mui/material/ClickAwayListener';

export default function TanggalDropdownCustomButton(props) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef();

  const { rows, value } = props;

  const tanggalList = Array.from(
    new Set(
      (rows || [])
        .map(row => {
          if (!row.tanggal) return "";
          const d = new Date(row.tanggal);
          if (isNaN(d.getTime())) return "";
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        })
        .filter(Boolean)
    )
  );

  return (
    <>
      <IconButton
        size="small"
        ref={anchorRef}
        onClick={() => setOpen(!open)}
        style={{ padding: 4, background: (value && value.length > 0) ? '#e3f0ff' : undefined, color: (value && value.length > 0) ? '#1976d2' : undefined }}
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
                tanggalList={tanggalList}
              />
            </div>
          </ClickAwayListener>
        </div>
      )}
    </>
  );
}
