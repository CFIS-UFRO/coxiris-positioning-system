import { app, dialog } from 'electron';
import https from 'https';
import log from 'electron-log';
import i18next from 'i18next';
import packageJson from '../../../package.json';

/**
 * Fetches the latest version from the versions repository
 * @param {string} url - URL to fetch version from
 * @returns {Promise<string>} - Latest version
 */
function fetchLatestVersion(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Request failed with status code ${res.statusCode}, probably there is no version file in the repository`));
                return;
            }
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data.trim());
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Simplified check for updates - only verifies if new version is available and shows dialog
 * @param {BrowserWindow} mainWindow - Main application window
 * @param {boolean} showDialog - Whether to show dialog regardless of update status
 * @returns {Promise<{hasUpdate: boolean, currentVersion: string, latestVersion: string}>} Result object
 */
export async function checkForUpdates(mainWindow, showDialog = true) {
    try {
        const currentVersion = app.getVersion();
        const appName = packageJson.name;
        log.info(`Checking for updates`);
        log.info(`Current version: ${currentVersion}`);
        
        // Extract repository info from versions_repository
        if (!packageJson.versions_repository || !packageJson.repository) {
            log.info('"versions_repository" or "repository" not found in package.json');
            log.info('Skipping update check');
            if (showDialog) {
                await dialog.showMessageBox(mainWindow, {
                    type: 'warning',
                    title: i18next.t('updates.check_for_updates'),
                    message: i18next.t('updates.update_check_failed'),
                    buttons: [i18next.t('updates.close')],
                    defaultId: 0
                });
            }
            return {
                hasUpdate: false,
                currentVersion,
                latestVersion: null
            };
        }
        
        // Parse the versions repository URL to get owner and name
        const versionsRepoUrl = packageJson.versions_repository;
        const repoUrlParts = versionsRepoUrl.split('/').filter(part => part.length > 0);
        
        // Extract owner and repo name using negative indices
        const repoOwner = repoUrlParts[repoUrlParts.length - 2];
        const repoName = repoUrlParts[repoUrlParts.length - 1];
        
        // URL to fetch the latest version
        const versionUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/refs/heads/main/${appName}`;
        
        // Fetch the latest version
        const latestVersion = await fetchLatestVersion(versionUrl);
        log.info(`Latest version: ${latestVersion}`);
        
        // Repository URL for releases
        const repositoryUrl = packageJson.repository;
        
        // Check if update is available
        const hasUpdate = currentVersion < latestVersion;
        
        // Create result object
        const result = {
            hasUpdate,
            currentVersion,
            latestVersion
        };
        
        // Show dialog if: (showDialog is true) OR (hasUpdate is true)
        // This means dialog is always shown when there's an update, regardless of showDialog value
        if (showDialog || hasUpdate) {
            const message = hasUpdate ? i18next.t('updates.update_available') : i18next.t('updates.up_to_date');
            const detail = hasUpdate 
                ? `${i18next.t('updates.current_version')}: ${currentVersion}\n${i18next.t('updates.latest_version')}: ${latestVersion}`
                : `${i18next.t('updates.current_version')}: ${currentVersion}`;
            
            // Different buttons based on whether there's an update
            const buttons = hasUpdate 
                ? [i18next.t('updates.go_to_download'), i18next.t('updates.close')]
                : [i18next.t('updates.close')];
            
            const { response } = await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: i18next.t('updates.check_for_updates'),
                message: message,
                detail: detail,
                buttons: buttons,
                defaultId: 0,
                cancelId: buttons.length - 1
            });
            
            // If there's an update and user chooses "Go to Download Page"
            if (hasUpdate && response === 0) {
                // Use electron shell to open the URL in the default browser
                const { shell } = await import('electron');
                shell.openExternal(`${repositoryUrl}/releases`);
            }
        }
        
        return result;
    } catch (error) {
        log.error('Error checking for updates:', error);
        
        return {
            hasUpdate: false,
            currentVersion: app.getVersion(),
            latestVersion: null,
            error: error.message
        };
    }
}