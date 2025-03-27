import { register, init, locale } from 'svelte-i18n';
import log from 'electron-log';

/**
 * Initialize svelte-i18n in the renderer process
 * Relies on main process for language preferences
 */
export async function initializeI18n() {
  // Dynamically import all language files from the locales folder
  const languageFiles = import.meta.glob('../assets/locales/*.json');

  // Extract supported languages from the file paths
  const supportedLanguages = Object.keys(languageFiles).map(filePath => {
    // Get the language code from the file name (removes the path and extension)
    const match = filePath.match(/\/([^/]+)\.json$/);
    return match ? match[1] : null;
  }).filter(Boolean); // Filter out any null values

  // Fallback language
  const fallbackLanguage = 'en';

  // Register all languages
  for (const lang of supportedLanguages) {
    register(lang, () => languageFiles[`../assets/locales/${lang}.json`]());
  }

  // Initialize i18n with the current language
  const currentLanguage = window.electron.ipcRenderer.sendSync('get-language');
  init({
    fallbackLocale: fallbackLanguage,
    initialLocale: currentLanguage
  });
  locale.set(currentLanguage);

  // Listener for language changes
  window.electron.ipcRenderer.on('language-changed', (event, lang) => {
    locale.set(lang);
  });
}

export default initializeI18n;
