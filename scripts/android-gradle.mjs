#!/usr/bin/env node
/**
 * Run Gradle in android/ with JDK 11+ (Android Gradle Plugin 8.x requirement).
 * Prefers JAVA_HOME, then Android Studio bundled JBR, then common JDK install paths.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const androidDir = join(root, 'android');
const isWin = process.platform === 'win32';
const gradlew = join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
const task = process.argv[2] || 'bundleRelease';

function javaMajor(javaHome) {
  const javaBin = join(javaHome, 'bin', isWin ? 'java.exe' : 'java');
  if (!existsSync(javaBin)) return 0;
  const r = spawnSync(javaBin, ['-version'], { encoding: 'utf8' });
  const out = (r.stderr || r.stdout || '').toString();
  const m = out.match(/version "(\d+)/);
  if (!m) return 0;
  const v = Number(m[1]);
  return v === 1 ? 8 : v;
}

function expandJdkFolders(base) {
  if (!existsSync(base)) return [];
  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(base, d.name));
  } catch {
    return [];
  }
}

function findJavaHome() {
  if (process.env.JAVA_HOME) {
    const major = javaMajor(process.env.JAVA_HOME);
    if (major >= 11) return process.env.JAVA_HOME;
    console.warn(
      `JAVA_HOME is Java ${major || '?'} (need 11+). Searching for another JDK…`
    );
  }

  const candidates = [];
  if (isWin) {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const local = process.env.LOCALAPPDATA || '';
    candidates.push(
      join(pf, 'Android', 'Android Studio', 'jbr'),
      join(local, 'Programs', 'Android', 'Android Studio', 'jbr')
    );
    candidates.push(...expandJdkFolders(join(pf, 'Eclipse Adoptium')));
    candidates.push(...expandJdkFolders(join(pf, 'Java')));
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home');
    candidates.push(...expandJdkFolders('/Library/Java/JavaVirtualMachines'));
  } else {
    const home = process.env.HOME || '';
    candidates.push(join(home, 'android-studio/jbr'));
    candidates.push(...expandJdkFolders('/usr/lib/jvm'));
  }

  for (const home of candidates) {
    if (!home || !existsSync(home)) continue;
    if (javaMajor(home) >= 11) return home;
  }
  return null;
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error(
    'No JDK 11+ found. Install JDK 17 or Android Studio, or set JAVA_HOME to a modern JDK.'
  );
  process.exit(1);
}

const major = javaMajor(javaHome);
console.log(`Using Java ${major} at ${javaHome}`);
console.log(`Gradle: ${task}\n`);

const env = { ...process.env, JAVA_HOME: javaHome };
const pathKey = isWin ? 'Path' : 'PATH';
env[pathKey] = `${join(javaHome, 'bin')}${isWin ? ';' : ':'}${process.env[pathKey] || ''}`;

const r = spawnSync(gradlew, [task], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(r.status ?? 1);
