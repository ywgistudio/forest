export const Button = {
  baseStyle: {
    fontWeight: 'bold',
  },
  variants: {
    ghost: {
      color: 'text.primary',
    },
    solid: {
      color: 'text.secondary',
      bg: (props: any) => props.colorScheme || 'brand.primary',
    },
  },
};
