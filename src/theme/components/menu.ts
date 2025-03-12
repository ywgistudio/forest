export const Menu = {
  parts: ['button', 'list', 'item', 'groupTitle'],
  baseStyle: {
    list: {
      bg: 'brand.secondary',
      color: 'text.secondary',
      borderColor: 'ui.light',
    },
    item: {
      bg: 'transparent',
      color: 'text.secondary',
      _hover: {
        bg: 'transparent',
      },
      _focus: {
        bg: 'transparent',
      },
      _active: {
        bg: 'transparent',
      },
    },
    groupTitle: {
      fontWeight: 'bold',
      color: 'text.secondary',
    },
    command: {
      color: 'text.secondary',
    },
  },
};
