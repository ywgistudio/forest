export const styles = {
  global: (props: any) => ({
    'html, body': {
      backgroundColor: 'brand.primary',
      color: 'text.primary',
      fontFamily: 'body',
    },
    '.react-flow__node': {
      borderRadius: '6px',
      borderWidth: '0px',
    },
    '.react-flow__node:not(.selected):hover': {
      boxShadow: '0 0 0 0.5px #DDDDDD !important',
    },
    '.react-flow__background': {
      backgroundColor: 'brand.primary !important',
    },
    '.react-flow__controls': {
      backgroundColor: 'ui.dark !important',
      borderColor: 'ui.medium !important',
    },
    '.react-flow__controls button': {
      backgroundColor: 'ui.dark !important',
      color: 'text.primary !important',
      borderColor: 'ui.medium !important',
    },
    '.selected': {
      boxShadow: '0px 0px 0px 2px #CCCCCC, 0px 0px 20px 2px #AAAAAA !important',
    },
    '.markdown-wrapper h1, .markdown-wrapper h2, .markdown-wrapper h3, .markdown-wrapper h4, .markdown-wrapper h5, .markdown-wrapper h6': {
      fontSize: 'inherit',
      fontWeight: 500,
    },
    '.markdown-wrapper blockquote': {
      margin: 'revert',
    },
    '.markdown-wrapper h1': {
      fontSize: '2em',
    },
    '.markdown-wrapper h2': {
      fontSize: '1.5em',
    },
    '.markdown-wrapper h3': {
      fontSize: '1.17em',
    },
    '.markdown-wrapper h4': {
      fontSize: '1em',
    },
    '.markdown-wrapper h5': {
      fontSize: '0.83em',
    },
    '.markdown-wrapper h6': {
      fontSize: '0.67em',
    },
    '.markdown-wrapper hr': {
      backgroundColor: 'currentColor',
      height: '2px',
      border: '0px',
      borderRadius: '6px',
    },
  }),
};
