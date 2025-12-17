package dev.mainul35.flashcardapp.plugin.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnostics")
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PluginDiagnosticsController {

    @Value("${app.plugin.directory:plugins}")
    private String pluginDirectory;

    @GetMapping("/plugin-info")
    public Map<String, Object> getPluginInfo() {
        Map<String, Object> info = new HashMap<>();

        // Current working directory
        String cwd = System.getProperty("user.dir");
        info.put("workingDirectory", cwd);

        // Plugin directory config
        info.put("pluginDirectoryConfig", pluginDirectory);

        // Absolute plugin directory path
        File pluginDir = new File(pluginDirectory);
        info.put("pluginDirectoryAbsolute", pluginDir.getAbsolutePath());
        info.put("pluginDirectoryExists", pluginDir.exists());
        info.put("pluginDirectoryIsDirectory", pluginDir.isDirectory());

        // List JAR files
        if (pluginDir.exists() && pluginDir.isDirectory()) {
            File[] jarFiles = pluginDir.listFiles((dir, name) -> name.endsWith(".jar"));
            if (jarFiles != null) {
                info.put("jarFileCount", jarFiles.length);
                String[] jarNames = new String[jarFiles.length];
                for (int i = 0; i < jarFiles.length; i++) {
                    jarNames[i] = jarFiles[i].getName();
                }
                info.put("jarFiles", jarNames);
            } else {
                info.put("jarFileCount", 0);
                info.put("jarFiles", new String[0]);
            }
        } else {
            info.put("jarFileCount", 0);
            info.put("jarFiles", new String[0]);
        }

        return info;
    }
}
