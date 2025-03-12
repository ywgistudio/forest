import React from "react";
import { ButtonProps, Button, Tooltip, forwardRef } from "@chakra-ui/react";
import { adjustColor } from "../../utils/color";

// Define a simpler props interface to avoid TypeScript union complexity
interface BigButtonProps {
  color: string;
  tooltip: string;
  onClick?: () => void;
  children?: React.ReactNode;
  width?: string | number;
  height?: string | number;
  fontSize?: string;
}

export const BigButton = forwardRef<HTMLButtonElement, BigButtonProps>(
  ({ color, tooltip, children, ...rest }, ref) => {
    // Let the theme handle most of the styling
    return (
      <Tooltip label={tooltip}>
        <Button
          ref={ref}
          bg={color}
          _hover={{
            bg: adjustColor(color, -20),
          }}
          variant="solid"
          {...rest}
        >
          {children}
        </Button>
      </Tooltip>
    );
  }
);

BigButton.displayName = "BigButton";
