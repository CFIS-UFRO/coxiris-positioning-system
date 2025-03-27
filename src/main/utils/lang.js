import i18next from 'i18next';
import Store from 'electron-store';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import { APP_FOLDER_DIR } from './paths.js';
import { ipcMain, BrowserWindow } from 'electron';

// Initialize store
const store = new Store();

// Automatically detect supported languages from locale files
export const supportedLanguages = [];
const localesPath = path.join(APP_FOLDER_DIR, 'resources/locales');

try {
    fs.readdirSync(localesPath)
        .filter(file => file.endsWith('.json'))
        .forEach(file => supportedLanguages.push(path.basename(file, '.json')));
} catch (error) {
    log.error('Error reading locale files:', error);
}

// Add 'system' as an additional option
supportedLanguages.push('system');

// Default language settings
let defaultLanguage = 'system';
let fallbackLanguage = 'en';

/**
 * Initialize language settings and translations
 */
export function initializeLanguage() {
    // Load translations dynamically
    const translations = {};
    supportedLanguages.filter(lang => lang !== 'system').forEach(lang => {
        const filePath = path.join(localesPath, `${lang}.json`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            translations[lang] = { translation: JSON.parse(content) };
        } catch (error) {
            log.error(`Error loading language file ${filePath}:`, error);
        }
    });

    // Get the user's selected language preference
    const userLanguage = getCurrentLanguage();
    log.info(`Setting language to: ${userLanguage}`);

    // Get the effective language
    const effectiveLanguage = getEffectiveLanguage();

    // Configure i18next
    i18next.init({
        lng: effectiveLanguage,
        resources: translations
    });

    // IPC listener to retrieve the current language
    ipcMain.on('get-language', (event) => {
        event.returnValue = getEffectiveLanguage();
    });
}

/**
 * Get the system's default language if supported, otherwise fallback to default
 */
export function getSystemLanguage() {
    const systemLocale = app.getLocale().split('-')[0]; // Extract the base language without region
    return supportedLanguages.includes(systemLocale) ? systemLocale : fallbackLanguage;
}

/**
 * Set the application language
 */
export function setLanguage(lang) {
    if (supportedLanguages.includes(lang)) {
        log.info(`Changing language to: ${lang}`);
        store.set('language', lang);
        lang = getEffectiveLanguage();
        i18next.changeLanguage(lang);
        BrowserWindow.getAllWindows()[0].webContents.send('language-changed', lang);
        return true;
    }
    return false;
}

/**
 * Get the current language stored in the settings
 */
export function getCurrentLanguage() {
    return store.get('language', defaultLanguage);
}

/**
 * Get the effective language (resolves 'system' to an actual language)
 */
export function getEffectiveLanguage() {
    const savedLanguage = getCurrentLanguage();
    return savedLanguage === 'system' ? getSystemLanguage() : savedLanguage;
}
