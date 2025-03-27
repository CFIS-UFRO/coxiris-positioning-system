
/**
 * Initialize the theme
 */
export default function initializeTheme() {
    // Get current theme from main
    const currentTheme = window.electron.ipcRenderer.sendSync('get-theme');
    // Set the theme
    document.documentElement.setAttribute('class', currentTheme);
    // Listener for theme changes
    window.electron.ipcRenderer.on('theme-changed', (event, theme) => {
        document.documentElement.setAttribute('class', theme);
    }
    );
}