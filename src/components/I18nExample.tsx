import { useTranslation } from 'react-i18next';

export default function I18nExample() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        padding: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '5px',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>{t('app.title')}</h2>
      <p>{t('app.welcome')}</p>
      <p>{t('common.loading')}</p>
    </div>
  );
}
