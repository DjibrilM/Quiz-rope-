const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Expo Config Plugin that fixes the "command 'node'" error in EAS local builds
 * on macOS where Gradle runs with a minimal PATH (/usr/bin:/bin:/usr/sbin:/sbin)
 * that does not include /usr/local/bin or NVM paths.
 *
 * Two-pronged fix:
 *  1. Patches gradlew to prepend the node binary's directory to PATH before
 *     the Gradle JVM launches — so ProcessBuilder("node") works inside compiled
 *     Kotlin plugins (e.g. expo-autolinking-settings-plugin).
 *  2. Patches settings.gradle to replace bare "node" string literals with the
 *     full absolute path for any exec-style calls in Groovy/KTS DSL.
 */
const withNodePath = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidDir = path.join(config.modRequest.projectRoot, 'android');

      // --- Resolve node binary path ---
      let nodePath;
      try {
        const candidates = [
          process.env.NODE_BINARY, // Prioritize binary provided by EAS/Environment
          '/usr/local/bin/node',
          '/opt/homebrew/bin/node',
          '/usr/bin/node',
        ].filter(Boolean);

        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            nodePath = candidate;
            break;
          }
        }
        
        if (!nodePath) {
          try {
            nodePath = execSync('which node', { encoding: 'utf8' }).trim();
          } catch (e) {
            // fallback to a guess if 'which' fails
            nodePath = '/usr/local/bin/node';
          }
        }
      } catch {
        nodePath = '/usr/local/bin/node';
      }

      if (!nodePath) return config;

      const nodeDir = path.dirname(nodePath);

      // --- 1. Patch gradlew to prepend node dir to PATH ---
      const gradlewPath = path.join(androidDir, 'gradlew');
      if (fs.existsSync(gradlewPath)) {
        let gradlew = fs.readFileSync(gradlewPath, 'utf8');
        const marker = '# node-path-patch';
        if (!gradlew.includes(marker)) {
          // Insert right after the shebang line
          gradlew = gradlew.replace(
            /^(#!.*\n)/,
            `$1${marker}\nexport PATH="${nodeDir}:$PATH"\n`,
          );
          fs.writeFileSync(gradlewPath, gradlew);
        }
      }

      // --- 2. Disable Gradle daemon so every build starts a fresh JVM that
      //        inherits the patched PATH from gradlew (daemon reuse would keep
      //        the old restricted PATH from a previous run).
      const gradlePropsPath = path.join(androidDir, 'gradle.properties');
      if (fs.existsSync(gradlePropsPath)) {
        let props = fs.readFileSync(gradlePropsPath, 'utf8');
        if (!props.includes('org.gradle.daemon=')) {
          props += '\n# Disable daemon so the gradlew PATH patch is always inherited\norg.gradle.daemon=false\n';
        } else {
          props = props.replace(/org\.gradle\.daemon\s*=\s*\S+/, 'org.gradle.daemon=false');
        }
        fs.writeFileSync(gradlePropsPath, props);
      }

      // --- 3. Create local.properties with sdk.dir if missing ---
      // expo prebuild generates a fresh android/ folder and gitignores local.properties,
      // so we need to create it every time.
      const localPropsPath = path.join(androidDir, 'local.properties');
      if (!fs.existsSync(localPropsPath)) {
        const androidHome =
          process.env.ANDROID_HOME ||
          process.env.ANDROID_SDK_ROOT ||
          `${process.env.HOME}/Library/Android/sdk`;
        fs.writeFileSync(localPropsPath, `sdk.dir=${androidHome}\n`);
      }

      // --- 4. Patch settings.gradle string literals ---
      const settingsGradlePath = path.join(androidDir, 'settings.gradle');
      if (fs.existsSync(settingsGradlePath)) {
        let content = fs.readFileSync(settingsGradlePath, 'utf8');
        // Replace standalone "node" or 'node' strings that are likely part of exec calls
        content = content.replace(/(?:"|')node(?:"|')(\s*[,)])/g, `"${nodePath}"$1`);
        fs.writeFileSync(settingsGradlePath, content);
      }

      return config;
    },
  ]);
};

module.exports = withNodePath;
