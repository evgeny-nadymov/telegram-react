import React from "react";
import Button from "@mui/material/Button";

/**
 * Simple wrapper for Material-UI Button component that ensures safe rendering even when theme issues occur
 */
const SafeButton = (props) => {
  const safeProps = { ...props };

  // Use safe color only if explicitly not specified
  if (!("variant" in props)) {
    safeProps.variant = "contained";
  }

  // Safe color for primary/secondary
  if (props.color === "primary" || props.color === "secondary") {
    // Keep original color
  } else if (!("color" in props)) {
    // Set default safe color
    safeProps.color = "primary";
  } else if (props.color === "default") {
    // Replace 'default' with 'text' for MUI v5
    safeProps.color = "text";
  }

  return <Button {...safeProps} />;
};

export default SafeButton;
