import { Global } from '@emotion/react';

export const FontLoader = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'Antique Legacy';
        src: url('/AntiqueLegacy-Regular.woff') format('woff'),
             url('/AntiqueLegacy-Regular.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }
    `}
  />
);
