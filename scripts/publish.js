import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../package.json');
const require = createRequire(import.meta.url);
const packageJson = require(packageJsonPath);

const log = (type, message) => console.log(`[${type.toUpperCase()}] ${message}`);

if (!process.env.GITHUB_TOKEN && packageJson.versions_repository) {
  log('error', 'GITHUB_TOKEN missing. Add it to .env or remove versions_repository.');
  process.exit(1);
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const [VERSIONS_REPO_OWNER, VERSIONS_REPO_NAME] = packageJson.versions_repository?.split('/').slice(-2) || [];

function updateVersion() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate();
  const versionRegex = new RegExp(`^${year}\\.${month}\\.${day}\\.(\\d+)$`);
  const versionOfDay = packageJson.version?.match(versionRegex)?.[1] ? +packageJson.version.match(versionRegex)[1] + 1 : 0;
  
  packageJson.version = `${year}.${month}.${day}.${versionOfDay}`;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('success', `Version updated to ${packageJson.version}`);
  
  return packageJson.version;
}

function githubRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${VERSIONS_REPO_OWNER}/${VERSIONS_REPO_NAME}${endpoint}`,
      method,
      headers: {
        'User-Agent': 'Release-Script',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => res.statusCode < 300 ? resolve(JSON.parse(responseData)) : reject(`GitHub API error: ${res.statusCode}`));
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function updateVersionsRepository(version) {
  if (!packageJson.versions_repository || !GITHUB_TOKEN) return log('info', 'Skipping versions repository update.');

  try {
    let fileSha;
    try {
      const fileInfo = await githubRequest('GET', `/contents/${packageJson.name}`);
      fileSha = fileInfo.sha;
    } catch {}

    const contentBase64 = Buffer.from(version).toString('base64');
    const updateData = { message: `Update ${packageJson.name} to ${version}`, content: contentBase64, ...(fileSha && { sha: fileSha }) };
    await githubRequest('PUT', `/contents/${packageJson.name}`, updateData);

    log('success', `Updated version file in GitHub: ${VERSIONS_REPO_OWNER}/${VERSIONS_REPO_NAME}`);
  } catch (error) {
    log('error', `Failed to update versions repository: ${error}`);
  }
}

async function runPublish() {
  try {
    if (execSync('git status --porcelain').toString().trim()) {
      log('error', 'Uncommitted changes detected. Commit or stash your changes.');
      process.exit(1);
    }

    const newVersion = updateVersion();
    await updateVersionsRepository(newVersion);

    execSync(`git add ${packageJsonPath} && git commit -m "Update version to ${newVersion}"`);
    execSync(`git tag v${newVersion}`);
    
    log('success', `Version ${newVersion} committed and tagged.`);
  } catch (error) {
    log('error', `Process failed: ${error}`);
    process.exit(1);
  }
}

runPublish();
