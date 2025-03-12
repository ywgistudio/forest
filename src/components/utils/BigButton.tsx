import { ButtonProps, Button, Tooltip } from "@chakra-ui/react";

import { adjustColor } from "../../utils/color";

export function BigButton({
  color,
  tooltip,
  ...others
}: { color: string; tooltip: string } & ButtonProps) {
  return (
    <Tooltip label={tooltip}>
      <Button
        bg={color}
        _hover={{
          bg: adjustColor(color, -20),
        }}
        {...others}
      />
    </Tooltip>
  );
}
