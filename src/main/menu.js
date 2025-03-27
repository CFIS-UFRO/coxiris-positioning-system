import { app, Menu, dialog } from 'electron';
import { t } from 'i18next';
import { getCurrentLanguage, setLanguage, supportedLanguages } from './utils/lang.js';
import { getCurrentTheme, setTheme, supportedThemes } from './utils/theme.js';
import { checkForUpdates } from './utils/updates.js';
import packageJson from '../../package.json';
import { LOG_FILE_DIR, USER_DATA_FILE_DIR, CACHE_FOLDER_DIR } from './utils/paths.js';

/**
 * Creates the application menu
 * @param {BrowserWindow} mainWindow - Main application window
 */
export function createMenu(mainWindow) {

    // -------------------------------------
    // File menu
    // -------------------------------------
    const fileMenu = {
        label: t('menu.file.title'),
        submenu: [
            {
                label: t('menu.file.open_logs'),
                click: async () => {
                    const { shell } = await import('electron');
                    shell.showItemInFolder(LOG_FILE_DIR);
                }
            },
            {
                label: t('menu.file.open_preferences'),
                click: async () => {
                    const { shell } = await import('electron');
                    shell.showItemInFolder(USER_DATA_FILE_DIR);
                }
            },
            {
                label: t('menu.file.open_cache'),
                click: async () => {
                    const { shell } = await import('electron');
                    shell.showItemInFolder(CACHE_FOLDER_DIR);
                }
            },
            { type: 'separator' },
            ...(packageJson.repository && packageJson.versions_repository ? [{
                label: t('menu.file.check_for_updates'),
                click: () => checkForUpdates(mainWindow)
            },
            { type: 'separator' }] : []),
            {
                label: t('menu.file.quit'),
                role: 'quit'
            }
        ]
    };

    // -------------------------------------
    // Edit menu
    // -------------------------------------
    const editMenu = {
        label: t('menu.edit.title'),
        submenu: [
            {
                label: t('menu.edit.undo'),
                role: 'undo'
            },
            {
                label: t('menu.edit.redo'),
                role: 'redo'
            },
            { type: 'separator' },
            {
                label: t('menu.edit.cut'),
                role: 'cut'
            },
            {
                label: t('menu.edit.copy'),
                role: 'copy'
            },
            {
                label: t('menu.edit.paste'),
                role: 'paste'
            },
            {
                label: t('menu.edit.delete'),
                role: 'delete'
            },
            { type: 'separator' },
            {
                label: t('menu.edit.select_all'),
                role: 'selectAll'
            }
        ]
    };

    // -------------------------------------
    // View menu
    // -------------------------------------
    const viewMenu = {
        label: t('menu.view.title'),
        submenu: [
            {
                label: t('menu.view.reload'),
                role: 'reload'
            },
            {
                label: t('menu.view.force_reload'),
                role: 'forceReload'
            },
            {
                label: t('menu.view.toggle_dev_tools'),
                role: 'toggleDevTools'
            },
            { type: 'separator' },
            {
                label: t('menu.view.reset_zoom'),
                role: 'resetZoom'
            },
            {
                label: t('menu.view.zoom_in'),
                role: 'zoomIn'
            },
            {
                label: t('menu.view.zoom_out'),
                role: 'zoomOut'
            },
            { type: 'separator' },
            {
                label: t('menu.view.toggle_fullscreen'),
                role: 'togglefullscreen'
            }
        ]
    };

    // -------------------------------------
    // Settings - Language submenu
    // -------------------------------------
    const currentLang = getCurrentLanguage();

    // Create language submenu items
    const languageSubmenu = supportedLanguages.map(lang => {
        return {
            label: t(`language.${lang}`),
            type: 'radio',
            checked: currentLang === lang,
            click: () => {
                if (currentLang !== lang) {
                    setLanguage(lang, mainWindow);
                    createMenu(mainWindow);
                }
            }
        };
    });

    // -------------------------------------
    // Settings - Theme submenu
    // -------------------------------------
    const themeSubmenu = supportedThemes.map(theme => {
        return {
            label: t(`themes.${theme}`),
            type: 'radio',
            checked: getCurrentTheme() === theme,
            click: () => {
                if (getCurrentTheme() !== theme) {
                    setTheme(theme, mainWindow);
                }
            }
        };
    });

    // -------------------------------------
    // Settings menu
    // -------------------------------------
    const settingsMenu = {
        label: t('menu.settings.title'),
        submenu: [
            {
                label: t('menu.settings.language'),
                submenu: languageSubmenu
            },
            {
                label: t('menu.settings.theme'),
                submenu: themeSubmenu
            }
        ]
    };

    // -------------------------------------
    // About submenu
    // -------------------------------------
    const aboutSubmenu = [
        ...(packageJson.repository ? [
            {
                label: t('menu.about.repository'),
                click: async () => {
                    const { shell } = await import('electron');
                    shell.openExternal(packageJson.repository);
                }
            },
            {
                label: t('menu.about.releases'),
                click: async () => {
                    const { shell } = await import('electron');
                    shell.openExternal(`${packageJson.repository}/releases`);
                }
            },
            { type: 'separator' },
        ] : []),
        {
            label: t('menu.about.author'),
            click: () => {
                const authorString = packageJson.author || '';
                const authors = authorString.split(',').map(author => {
                    const match = author.trim().match(/(.+?)\s*<(.+?)>/);
                    return match ? { name: match[1].trim(), email: match[2].trim() } : { name: author.trim(), email: '' };
                });
                
                const authorsDetail = authors
                    .map(author => `${author.name}${author.email ? ': ' + author.email : ''}`)
                    .join('\n');
                
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: authors.length > 1 ? t('menu.about.authors') : t('menu.about.author'),
                    message: authors.length > 1 ? t('menu.about.authors') : t('menu.about.author'),
                    detail: authorsDetail || packageJson.author,
                    buttons: ['OK']
                });
            }
        },
        {
            label: t('menu.about.title'),
            click: () => {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: t('menu.about.title'),
                    message: `${app.getName()} ${app.getVersion()}`,
                    detail: t('menu.about.about_message'),
                    buttons: ['OK']
                });
            }
        }
    ];

    // -------------------------------------
    // About menu
    // -------------------------------------
    const aboutMenu = {
        label: t('menu.about.title'),
        submenu: aboutSubmenu
    };

    // -------------------------------------
    // Main menu template
    // -------------------------------------
    const template = [
        fileMenu,
        editMenu,
        viewMenu,
        settingsMenu,
        aboutMenu
    ];

    // -------------------------------------
    // Set menu
    // -------------------------------------
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
}