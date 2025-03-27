import { dirname, join } from 'path';
import os from 'os';
import Store from 'electron-store';
import log from 'electron-log';
import packageJson from '../../../package.json';
import fs from 'fs';

// Init store
const store = new Store();

// Define paths
export const CACHE_FOLDER_DIR = join(os.tmpdir(), packageJson.name);
export const LOG_FILE_DIR = log.transports.file.getFile().path;
export const LOG_FOLDER_DIR = dirname(LOG_FILE_DIR);
export const USER_DATA_FILE_DIR = store.path;
export const USER_DATA_FOLDER_DIR = dirname(USER_DATA_FILE_DIR);
export const APP_FOLDER_DIR = join(__dirname, '../../');

// Create folders if they don't exist
const folders = [CACHE_FOLDER_DIR, LOG_FOLDER_DIR, USER_DATA_FOLDER_DIR];
folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
        try {
            fs.mkdirSync(folder, { recursive: true });
        } catch (err) {
            log.error(`Error creating folder: ${folder}`, err);
        }
    }
});