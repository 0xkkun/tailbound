import 'react-i18next';

import ko from '@i18n/locales/ko.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ko;
    };
  }
}
