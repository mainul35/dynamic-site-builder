package dev.mainul35.flashcardapp.plugin.core;

import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.component.ComponentManifest;
import dev.mainul35.flashcardapp.plugin.entity.Plugin;
import dev.mainul35.flashcardapp.plugin.repository.PluginRepository;
import dev.mainul35.flashcardapp.sitebuilder.service.ComponentRegistryService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PluginManager is the central component for managing the plugin lifecycle.
 * It handles installing, uninstalling, activating, and deactivating plugins.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PluginManager {

    private final PluginRepository pluginRepository;
    private final ComponentRegistryService componentRegistryService;
    private final ApplicationContext applicationContext;

    @Value("${app.plugin.directory:plugins}")
    private String pluginDirectory;

    @Value("${app.plugin.hot-reload.enabled:true}")
    private boolean hotReloadEnabled;

    /**
     * Map of plugin ID to loaded plugin instances
     * Thread-safe for hot-reload scenarios
     */
    private final Map<String, Object> loadedPlugins = new ConcurrentHashMap<>();

    /**
     * Map of plugin ID to ClassLoader
     */
    private final Map<String, PluginClassLoader> pluginClassLoaders = new ConcurrentHashMap<>();

    /**
     * Initialize the plugin system on startup
     */
    @PostConstruct
    public void initialize() {
        log.info("Initializing Plugin Manager...");
        log.info("Plugin directory: {}", pluginDirectory);
        log.info("Hot reload enabled: {}", hotReloadEnabled);

        // Create plugin directory if it doesn't exist
        File pluginDir = new File(pluginDirectory);
        if (!pluginDir.exists()) {
            pluginDir.mkdirs();
            log.info("Created plugin directory: {}", pluginDirectory);
        }

        // Load and activate all bundled plugins
        loadBundledPlugins();

        // Load and activate all previously activated third-party plugins
        loadActivatedPlugins();

        log.info("Plugin Manager initialized successfully");
    }

    /**
     * Load bundled plugins (shipped with the application)
     */
    private void loadBundledPlugins() {
        log.info("Loading bundled plugins...");
        List<Plugin> bundledPlugins = pluginRepository.findByIsBundled(true);
        for (Plugin plugin : bundledPlugins) {
            if ("activated".equals(plugin.getStatus())) {
                try {
                    activatePlugin(plugin.getPluginId());
                } catch (Exception e) {
                    log.error("Failed to activate bundled plugin: {}", plugin.getPluginId(), e);
                }
            }
        }
        log.info("Loaded {} bundled plugins", bundledPlugins.size());
    }

    /**
     * Load previously activated third-party plugins
     */
    private void loadActivatedPlugins() {
        log.info("Loading activated third-party plugins...");
        scanAndLoadPlugins();
    }

    /**
     * Scan plugins directory and load all plugin JARs
     */
    private void scanAndLoadPlugins() {
        log.info("Scanning plugins directory for JAR files: {}", pluginDirectory);
        File pluginDir = new File(pluginDirectory);

        if (!pluginDir.exists() || !pluginDir.isDirectory()) {
            log.warn("Plugin directory does not exist: {}", pluginDirectory);
            return;
        }

        File[] jarFiles = pluginDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jarFiles == null || jarFiles.length == 0) {
            log.info("No plugin JAR files found in directory: {}", pluginDirectory);
            return;
        }

        log.info("Found {} plugin JAR file(s)", jarFiles.length);
        int loaded = 0;
        for (File jarFile : jarFiles) {
            try {
                loadPluginFromJar(jarFile);
                loaded++;
            } catch (Exception e) {
                log.error("Failed to load plugin from JAR: {}", jarFile.getName(), e);
            }
        }
        log.info("Successfully loaded {} plugin(s)", loaded);
    }

    /**
     * Load a plugin from a JAR file
     */
    private void loadPluginFromJar(File jarFile) throws Exception {
        log.info("Loading plugin from JAR: {}", jarFile.getName());

        // Read plugin manifest
        PluginManifest manifest = PluginManifest.loadFromJar(jarFile);
        log.info("Plugin manifest: {} v{}", manifest.getPluginName(), manifest.getVersion());

        String pluginId = manifest.getPluginId();
        String mainClass = manifest.getMainClass();

        // Create plugin ClassLoader
        PluginClassLoader classLoader = PluginClassLoader.fromJarFile(pluginId, jarFile,
                getClass().getClassLoader());
        pluginClassLoaders.put(pluginId, classLoader);

        // Instantiate plugin class
        Object pluginInstance = classLoader.instantiatePluginClass(mainClass);
        log.info("Instantiated plugin class: {}", mainClass);

        // Create plugin context
        Path dataDir = Path.of(pluginDirectory, pluginId, "data");
        Path configDir = Path.of(pluginDirectory, pluginId, "config");
        Files.createDirectories(dataDir);
        Files.createDirectories(configDir);

        DefaultPluginContext context = DefaultPluginContext.builder()
                .pluginId(pluginId)
                .version(manifest.getVersion())
                .dataDirectory(dataDir)
                .configDirectory(configDir)
                .pluginClassLoader(classLoader)
                .platformContext(applicationContext)
                .active(true)
                .build();

        // Call plugin lifecycle methods
        if (pluginInstance instanceof dev.mainul35.cms.sdk.Plugin) {
            dev.mainul35.cms.sdk.Plugin plugin = (dev.mainul35.cms.sdk.Plugin) pluginInstance;
            plugin.onLoad(context);
            plugin.onActivate(context);

            // If it's a UI component plugin, register it
            if (pluginInstance instanceof UIComponentPlugin) {
                UIComponentPlugin uiPlugin = (UIComponentPlugin) pluginInstance;
                ComponentManifest componentManifest = uiPlugin.getComponentManifest();
                componentRegistryService.registerComponent(componentManifest);
                log.info("Registered UI component: {} from plugin: {}",
                        componentManifest.getComponentId(), pluginId);
            }
        }

        // Store loaded plugin
        loadedPlugins.put(pluginId, pluginInstance);

        // Save or update plugin in database
        savePluginToDatabase(manifest, jarFile);

        log.info("Successfully loaded plugin: {}", pluginId);
    }

    /**
     * Save plugin metadata to database
     */
    @Transactional
    private void savePluginToDatabase(PluginManifest manifest, File jarFile) {
        Optional<Plugin> existing = pluginRepository.findByPluginId(manifest.getPluginId());

        Plugin plugin;
        if (existing.isPresent()) {
            plugin = existing.get();
        } else {
            plugin = new Plugin();
            plugin.setPluginId(manifest.getPluginId());
            plugin.setIsBundled(false);
        }

        plugin.setPluginName(manifest.getPluginName());
        plugin.setVersion(manifest.getVersion());
        plugin.setDescription(manifest.getDescription());
        plugin.setAuthor(manifest.getAuthor());
        plugin.setPluginType(manifest.getPluginType());
        plugin.setJarPath(jarFile.getAbsolutePath());
        plugin.activate();

        pluginRepository.save(plugin);
        log.info("Saved plugin to database: {}", manifest.getPluginId());
    }

    /**
     * Install a new plugin from a JAR file
     *
     * @param jarFile Path to the plugin JAR file
     * @return The installed plugin
     * @throws Exception if installation fails
     */
    @Transactional
    public Plugin installPlugin(File jarFile) throws Exception {
        log.info("Installing plugin from: {}", jarFile.getAbsolutePath());

        // TODO: Phase 1 - Basic implementation
        // Future phases will add:
        // 1. JAR validation and signature verification
        // 2. Extract plugin.yml manifest
        // 3. Validate dependencies
        // 4. Create Plugin entity
        // 5. Copy JAR to plugin directory
        // 6. Register in database

        throw new UnsupportedOperationException("Plugin installation will be implemented in Phase 2");
    }

    /**
     * Uninstall a plugin
     *
     * @param pluginId The plugin ID to uninstall
     * @throws Exception if uninstallation fails
     */
    @Transactional
    public void uninstallPlugin(String pluginId) throws Exception {
        log.info("Uninstalling plugin: {}", pluginId);

        Plugin plugin = pluginRepository.findByPluginId(pluginId)
                .orElseThrow(() -> new IllegalArgumentException("Plugin not found: " + pluginId));

        // Deactivate first if active
        if (plugin.isActive()) {
            deactivatePlugin(pluginId);
        }

        // Remove from database
        pluginRepository.deleteByPluginId(pluginId);

        // TODO: Delete JAR file if third-party plugin
        // TODO: Run plugin uninstall hooks
        // TODO: Clean up plugin-specific data

        log.info("Plugin uninstalled successfully: {}", pluginId);
    }

    /**
     * Activate a plugin
     *
     * @param pluginId The plugin ID to activate
     * @throws Exception if activation fails
     */
    @Transactional
    public void activatePlugin(String pluginId) throws Exception {
        log.info("Activating plugin: {}", pluginId);

        Plugin plugin = pluginRepository.findByPluginId(pluginId)
                .orElseThrow(() -> new IllegalArgumentException("Plugin not found: " + pluginId));

        if (plugin.isActive()) {
            log.warn("Plugin is already active: {}", pluginId);
            return;
        }

        try {
            // TODO: Phase 1 - Basic structure only
            // Future implementation will:
            // 1. Load plugin JAR using PluginClassLoader
            // 2. Create Spring ApplicationContext for plugin
            // 3. Register plugin entities with JPA
            // 4. Register plugin controllers
            // 5. Run Flyway migrations for plugin
            // 6. Call plugin onActivate() hook

            plugin.activate();
            pluginRepository.save(plugin);

            log.info("Plugin activated successfully: {}", pluginId);
        } catch (Exception e) {
            plugin.setError();
            pluginRepository.save(plugin);
            throw new RuntimeException("Failed to activate plugin: " + pluginId, e);
        }
    }

    /**
     * Deactivate a plugin
     *
     * @param pluginId The plugin ID to deactivate
     * @throws Exception if deactivation fails
     */
    @Transactional
    public void deactivatePlugin(String pluginId) throws Exception {
        log.info("Deactivating plugin: {}", pluginId);

        Plugin plugin = pluginRepository.findByPluginId(pluginId)
                .orElseThrow(() -> new IllegalArgumentException("Plugin not found: " + pluginId));

        if (!plugin.isActive()) {
            log.warn("Plugin is not active: {}", pluginId);
            return;
        }

        try {
            // TODO: Phase 1 - Basic structure only
            // Future implementation will:
            // 1. Call plugin onDeactivate() hook
            // 2. Unregister plugin controllers
            // 3. Close plugin Spring ApplicationContext
            // 4. Unload plugin ClassLoader
            // 5. Remove from loadedPlugins map

            // Remove from maps
            loadedPlugins.remove(pluginId);
            PluginClassLoader classLoader = pluginClassLoaders.remove(pluginId);
            if (classLoader != null) {
                classLoader.close();
            }

            plugin.deactivate();
            pluginRepository.save(plugin);

            log.info("Plugin deactivated successfully: {}", pluginId);
        } catch (Exception e) {
            plugin.setError();
            pluginRepository.save(plugin);
            throw new RuntimeException("Failed to deactivate plugin: " + pluginId, e);
        }
    }

    /**
     * Get all installed plugins
     */
    public List<Plugin> getAllPlugins() {
        return pluginRepository.findAll();
    }

    /**
     * Get all activated plugins
     */
    public List<Plugin> getActivatedPlugins() {
        return pluginRepository.findAllActivated();
    }

    /**
     * Get a plugin by ID
     */
    public Optional<Plugin> getPlugin(String pluginId) {
        return pluginRepository.findByPluginId(pluginId);
    }

    /**
     * Check if a plugin is loaded
     */
    public boolean isPluginLoaded(String pluginId) {
        return loadedPlugins.containsKey(pluginId);
    }

    /**
     * Get loaded plugin instance
     */
    public Object getLoadedPlugin(String pluginId) {
        return loadedPlugins.get(pluginId);
    }
}
