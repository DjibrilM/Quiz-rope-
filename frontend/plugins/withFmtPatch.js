const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to patch the Podfile with a fix for the "fmt" library compilation error.
 * This error occurs in RN 0.81+ with newer Xcode versions due to consteval issues.
 */
const withFmtPatch = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      const patchCode = `
    # Fix for "fmt" call to consteval function error
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        base_h_path = "#{installer.sandbox.root}/fmt/include/fmt/base.h"
        if File.exist?(base_h_path)
          puts "Patching fmt/base.h to disable FMT_USE_CONSTEVAL"
          content = File.read(base_h_path)
          # Use a more robust regex to catch different spacing: #  define vs #define
          # Also just force it to 0 at the end of the detection block or just replace all 1s with 0s
          
          # Ensure file is writable
          File.chmod(0644, base_h_path)
          
          new_content = content.gsub(/#\\s*define\\s+FMT_USE_CONSTEVAL\\s+1/, "#define FMT_USE_CONSTEVAL 0")
          
          # Just to be absolutely sure, we can also prepend it
          if !new_content.start_with?("#define FMT_USE_CONSTEVAL 0")
            new_content = "#define FMT_USE_CONSTEVAL 0\\n" + new_content
          end
          
          File.write(base_h_path, new_content)
        end
      end
    end
`;

      // Find the react_native_post_install call and insert the patch before or after it
      if (podfileContent.includes('react_native_post_install(') && !podfileContent.includes('Patching fmt/base.h')) {
        // Insert after react_native_post_install block
        podfileContent = podfileContent.replace(
          /(react_native_post_install\([\s\S]+?\n\s+)\)/,
          `$1)${patchCode}`
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withFmtPatch;
