import React from "react";
import { useSnackbar } from "notistack";

/**
 *  Compatibility wrapper for the useSnackbar hook
 */
export function withSnackbarCompat(Component) {
  return function WrappedWithSnackbar(props) {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    return (
      <Component
        {...props}
        enqueueSnackbar={enqueueSnackbar}
        closeSnackbar={closeSnackbar}
      />
    );
  };
}

export default withSnackbarCompat;
