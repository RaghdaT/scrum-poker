import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import type { Task } from "../models/room";

interface NewTaskDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => Promise<void>;
}

function NewTaskDialog({
  open,
  loading,
  onClose,
  onSubmit,
}: NewTaskDialogProps) {
  const [taskId, setTaskId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTaskId("");
      setTaskName("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit() {
    setError(null);

    const trimmedTaskId = taskId.trim();
    const trimmedTaskName = taskName.trim();

    if (!trimmedTaskId) {
      setError("Please enter the task ID.");
      return;
    }

    await onSubmit({
      id: trimmedTaskId,
      ...(trimmedTaskName && {
        name: trimmedTaskName,
      }),
    });
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth>
      <DialogTitle sx={{ color: "black" }}>New Task</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Task ID"
            placeholder="RPRO-5733"
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Task name (optional)"
            placeholder="WBS Estimation"
            value={taskName}
            onChange={(event) => setTaskName(event.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ mb: 2, px: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        >
          Start Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NewTaskDialog;
