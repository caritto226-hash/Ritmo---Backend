import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";

function ActionIcon({ type }) {
  if (type === "duplicate") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="8" y="8" width="13" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </svg>
    );
  }
  if (type === "edit") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 5 4 4M4 20l4-.8L19 8a2.12 2.12 0 0 0-3-3L5 16l-1 4Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
    </svg>
  );
}

function ActionButton({ type, label, onClick }) {
  return (
    <Button
      className={type === "delete" ? "mobile-detail-action mobile-detail-delete" : "mobile-detail-action"}
      onClick={onClick}
      sx={{
        flex: 1,
        flexDirection: "column",
        minWidth: 0,
        minHeight: 48,
        gap: "2px",
        px: "3px",
        py: "5px",
        borderRadius: "var(--radius-control)",
        color: type === "delete" ? "#e0697e" : "var(--text-muted)",
        fontSize: "var(--type-caption)",
        fontWeight: 600,
        lineHeight: 1.2,
        textTransform: "none",
        "& svg": { width: 19, height: 19, flexShrink: 0 },
      }}
    >
      <ActionIcon type={type} />
      {label}
    </Button>
  );
}

function MobileItemDetails({ item, title, details, onClose, onDuplicate, onEdit, onDelete }) {
  return (
    <Drawer
      anchor="bottom"
      open={Boolean(item)}
      onClose={onClose}
      sx={{ zIndex: 1400 }}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: 520,
            maxHeight: "min(78dvh, 640px)",
            mx: "auto",
            border: "1px solid var(--surface-border)",
            borderBottom: 0,
            borderRadius: "var(--radius-card) var(--radius-card) 0 0",
            bgcolor: "var(--surface-primary)",
            color: "var(--text-primary)",
            boxShadow: "0 -4px 16px rgb(29 43 68 / 6%)",
            overflow: "hidden",
          },
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "min(78dvh, 640px)",
        }}
      >
        <Box sx={{ px: 2.5, pt: 1.25, pb: 1, overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 4,
              bgcolor: "var(--surface-border)",
              mx: "auto",
              mb: 2,
            }}
          />
          <Typography
            component="h2"
            sx={{ color: "var(--text-primary)", fontSize: "var(--type-title)", fontWeight: 700, mb: 1.5 }}
          >
            {title}
          </Typography>
          <Stack spacing={1.25}>
            {details.filter((detail) => detail.value !== "" && detail.value != null).map((detail) => (
              <Box key={detail.label}>
                <Typography sx={{ color: "var(--text-secondary)", fontSize: "var(--type-caption)", fontWeight: 600 }}>
                  {detail.label}
                </Typography>
                <Typography sx={{ color: "var(--text-primary)", fontSize: "var(--type-body)", overflowWrap: "anywhere" }}>
                  {detail.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "var(--surface-border)" }} />
        <Stack
          direction="row"
          spacing={0}
          sx={{
            flex: "0 0 auto",
            justifyContent: "space-between",
            mx: 1.5,
            mt: 1,
            mb: "max(12px, env(safe-area-inset-bottom, 12px))",
            px: 0.5,
            py: 0.5,
            border: "1px solid var(--surface-border)",
            borderRadius: "999px",
            bgcolor: "var(--surface-primary)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          <ActionButton type="duplicate" label="Duplicar" onClick={onDuplicate} />
          <ActionButton type="edit" label="Editar" onClick={onEdit} />
          <ActionButton type="delete" label="Eliminar" onClick={onDelete} />
        </Stack>
      </Box>
    </Drawer>
  );
}

export default MobileItemDetails;
