package dev.mainul35.cms.plugin.core;

import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.component.ComponentManifest;
import dev.mainul35.cms.plugin.entity.Plugin;
import dev.mainul35.cms.plugin.repository.PluginRepository;
import dev.mainul35.cms.sitebuilder.service.ComponentRegistryService;
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
    private final PluginContextManager pluginContextManager;
    private final PluginControllerRegistrar pluginControllerRegistrar;
    private final PluginEntityRegistrar pluginEntityRegistrar;

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

        // Verify plugin directory exists (should be at project root level, not inside core)
        File pluginDir = new File(pluginDirectory);
        if (!pluginDir.exists()) {
            log.warn("Plugin directory does not exist: {}. Please ensure the plugins directory exists at the project root.",
                    pluginDir.getAbsolutePath());
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

        // Close any existing classloader for this plugin (important for upgrades)
        PluginClassLoader existingClassLoader = pluginClassLoaders.remove(pluginId);
        if (existingClassLoader != null) {
            log.info("Closing existing classloader for plugin: {}", pluginId);
            try {
                existingClassLoader.close();
            } catch (Exception e) {
                log.warn("Error closing existing classloader for plugin {}: {}", pluginId, e.getMessage());
            }
        }

        // Remove from loaded plugins map if exists (for clean upgrade)
        loadedPlugins.remove(pluginId);

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

            // If it's a UI component plugin, register all its component manifests
            if (pluginInstance instanceof UIComponentPlugin uiPlugin) {
                for (ComponentManifest componentManifest : uiPlugin.getComponentManifests()) {
                    componentRegistryService.registerComponent(componentManifest);
                    log.info("Registered UI component: {} from plugin: {}",
                            componentManifest.getComponentId(), pluginId);
                }
            }
        }

        // Register plugin Spring components (controllers, services, repositories)
        if (manifest.hasSpringComponents()) {
            registerPluginSpringComponents(pluginId, manifest, classLoader);
        }

        // Store loaded plugin
        loadedPlugins.put(pluginId, pluginInstance);

        // Save or update plugin in database
        savePluginToDatabase(manifest, jarFile);

        log.info("Successfully loaded plugin: {}", pluginId);
    }

    /**
     * Register Spring components (controllers, services, repositories) from a plugin
     */
    private void registerPluginSpringComponents(String pluginId, PluginManifest manifest, ClassLoader classLoader) {
        log.info("Registering Spring components for plugin: {}", pluginId);

        try {
            // Get packages to scan
            String[] packagesToScan = manifest.getComponentScanPackages().toArray(new String[0]);

            if (packagesToScan.length == 0) {
                log.info("No packages to scan for plugin: {}", pluginId);
                return;
            }

            log.info("Scanning packages for plugin {}: {}", pluginId, Arrays.toString(packagesToScan));

            // Register entity packages if any (for logging/tracking purposes)
            if (manifest.hasEntities()) {
                for (String entityPackage : manifest.getEntityPackages()) {
                    pluginEntityRegistrar.scanAndRegisterEntities(pluginId, entityPackage, classLoader);
                }
            }

            // Register controllers, services, and repositories directly in main context
            // This approach ensures JPA repositories work correctly with the main EntityManager
            pluginControllerRegistrar.registerPluginComponents(pluginId, classLoader, packagesToScan);

            log.info("Successfully registered Spring components for plugin: {}", pluginId);

        } catch (Exception e) {
            log.error("Failed to register Spring components for plugin: {}", pluginId, e);
            throw new RuntimeException("Failed to register plugin Spring components: " + pluginId, e);
        }
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

        // 1. Validate JAR file exists and is readable
        if (!jarFile.exists() || !jarFile.isFile()) {
            throw new IllegalArgumentException("JAR file does not exist: " + jarFile.getAbsolutePath());
        }
        if (!jarFile.canRead()) {
            throw new IllegalArgumentException("Cannot read JAR file: " + jarFile.getAbsolutePath());
        }
        if (!jarFile.getName().endsWith(".jar")) {
            throw new IllegalArgumentException("File is not a JAR file: " + jarFile.getName());
        }

        // 2. Extract and validate plugin manifest
        PluginManifest manifest;
        try {
            manifest = PluginManifest.loadFromJar(jarFile);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid plugin JAR - could not read plugin.yml manifest: " + e.getMessage(), e);
        }

        String pluginId = manifest.getPluginId();
        if (pluginId == null || pluginId.isBlank()) {
            throw new IllegalArgumentException("Plugin manifest missing required 'plugin-id' field");
        }

        log.info("Installing plugin: {} v{}", manifest.getPluginName(), manifest.getVersion());

        // 3. Check if plugin is already installed - close any existing classloader to release file locks
        Optional<Plugin> existingPlugin = pluginRepository.findByPluginId(pluginId);
        if (existingPlugin.isPresent()) {
            Plugin existing = existingPlugin.get();
            log.info("Plugin {} already installed (version {}), will upgrade to version {}",
                    pluginId, existing.getVersion(), manifest.getVersion());

            // IMPORTANT: Close existing classloader first to release file locks on Windows
            // This must happen BEFORE we try to copy/overwrite the JAR file
            PluginClassLoader existingClassLoader = pluginClassLoaders.remove(pluginId);
            if (existingClassLoader != null) {
                log.info("Closing existing classloader for plugin {} to release file locks", pluginId);
                try {
                    existingClassLoader.close();
                    // Give Windows a moment to release the file lock
                    Thread.sleep(100);
                } catch (Exception e) {
                    log.warn("Error closing existing classloader for plugin {}: {}", pluginId, e.getMessage());
                }
            }

            // Remove from loaded plugins map
            loadedPlugins.remove(pluginId);

            // Deactivate existing plugin before upgrade (if still marked as active)
            if (existing.isActive()) {
                try {
                    // Use internal deactivation logic without trying to close classloader again
                    if (pluginControllerRegistrar.hasRegisteredControllers(pluginId)) {
                        pluginControllerRegistrar.unregisterControllers(pluginId);
                    }
                    if (pluginEntityRegistrar.hasRegisteredEntities(pluginId)) {
                        pluginEntityRegistrar.unregisterEntities(pluginId);
                    }
                    if (pluginContextManager.hasPluginContext(pluginId)) {
                        pluginContextManager.destroyPluginContext(pluginId);
                    }
                    existing.deactivate();
                    pluginRepository.save(existing);
                } catch (Exception e) {
                    log.warn("Error during plugin deactivation cleanup for {}: {}", pluginId, e.getMessage());
                }
            }
        }

        // 4. Validate dependencies (if specified in manifest)
        List<String> dependencies = manifest.getDependencies();
        if (dependencies != null && !dependencies.isEmpty()) {
            for (String dependency : dependencies) {
                // Parse dependency format: "pluginId:version" or just "pluginId"
                String depPluginId = dependency.contains(":") ? dependency.split(":")[0] : dependency;
                if (!pluginRepository.findByPluginId(depPluginId).isPresent() && !loadedPlugins.containsKey(depPluginId)) {
                    throw new IllegalStateException("Missing required dependency: " + dependency);
                }
            }
            log.info("All dependencies satisfied for plugin: {}", pluginId);
        }

        // 5. Copy JAR to plugin directory with proper naming
        File pluginDir = new File(pluginDirectory);
        if (!pluginDir.exists()) {
            Files.createDirectories(pluginDir.toPath());
        }

        // Use plugin ID and version for the JAR file name (not the temp file name)
        String targetJarName = pluginId + "-" + manifest.getVersion() + ".jar";
        File targetJar = new File(pluginDir, targetJarName);

        // Copy the file with retry logic for Windows file locking issues
        int maxRetries = 5;
        int retryDelayMs = 200;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Files.copy(jarFile.toPath(), targetJar.toPath(),
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                log.info("Copied plugin JAR to: {}", targetJar.getAbsolutePath());
                lastException = null;
                break;
            } catch (Exception e) {
                lastException = e;
                if (attempt < maxRetries) {
                    log.warn("Failed to copy JAR (attempt {}/{}), retrying in {}ms: {}",
                            attempt, maxRetries, retryDelayMs, e.getMessage());
                    try {
                        Thread.sleep(retryDelayMs);
                        // Suggest garbage collection to help release file handles
                        System.gc();
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted while waiting to retry file copy", ie);
                    }
                }
            }
        }

        if (lastException != null) {
            throw new RuntimeException("Failed to copy plugin JAR after " + maxRetries +
                    " attempts. File may be locked by another process: " + lastException.getMessage(), lastException);
        }

        // 6. Create or update Plugin entity in database
        Plugin plugin = existingPlugin.orElse(new Plugin());
        plugin.setPluginId(pluginId);
        plugin.setPluginName(manifest.getPluginName());
        plugin.setVersion(manifest.getVersion());
        plugin.setDescription(manifest.getDescription());
        plugin.setAuthor(manifest.getAuthor());
        plugin.setPluginType(manifest.getPluginType());
        plugin.setJarPath(targetJar.getAbsolutePath());
        plugin.setIsBundled(false);
        plugin.setStatus("installed"); // Not yet activated

        plugin = pluginRepository.save(plugin);
        log.info("Plugin installed successfully: {} v{}", pluginId, manifest.getVersion());

        return plugin;
    }

    /**
     * Install and activate a plugin from a JAR file in one step
     *
     * @param jarFile Path to the plugin JAR file
     * @return The installed and activated plugin
     * @throws Exception if installation or activation fails
     */
    @Transactional
    public Plugin installAndActivatePlugin(File jarFile) throws Exception {
        Plugin plugin = installPlugin(jarFile);
        loadPluginFromJar(new File(plugin.getJarPath()));
        return plugin;
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

        // Check if any other plugins depend on this one
        List<Plugin> allPlugins = pluginRepository.findAll();
        for (Plugin otherPlugin : allPlugins) {
            if (!otherPlugin.getPluginId().equals(pluginId) && otherPlugin.isActive()) {
                // Check dependencies - this would require loading manifest, simplified check here
                log.debug("Checking if plugin {} depends on {}", otherPlugin.getPluginId(), pluginId);
            }
        }

        // Deactivate first if active
        if (plugin.isActive()) {
            deactivatePlugin(pluginId);
        }

        // Run plugin uninstall hooks if plugin instance is available
        Object pluginInstance = loadedPlugins.get(pluginId);
        if (pluginInstance instanceof dev.mainul35.cms.sdk.Plugin) {
            try {
                dev.mainul35.cms.sdk.Plugin sdkPlugin = (dev.mainul35.cms.sdk.Plugin) pluginInstance;
                // Create minimal context for uninstall
                Path dataDir = Path.of(pluginDirectory, pluginId, "data");
                Path configDir = Path.of(pluginDirectory, pluginId, "config");
                DefaultPluginContext context = DefaultPluginContext.builder()
                        .pluginId(pluginId)
                        .version(plugin.getVersion())
                        .dataDirectory(dataDir)
                        .configDirectory(configDir)
                        .pluginClassLoader(pluginClassLoaders.get(pluginId))
                        .platformContext(applicationContext)
                        .active(false)
                        .build();
                sdkPlugin.onUninstall(context);
                log.info("Called onUninstall hook for plugin: {}", pluginId);
            } catch (Exception e) {
                log.warn("Error running uninstall hook for plugin {}: {}", pluginId, e.getMessage());
            }
        }

        // Unregister UI component if it was registered
        if (pluginInstance instanceof UIComponentPlugin) {
            UIComponentPlugin uiPlugin = (UIComponentPlugin) pluginInstance;
            String componentId = uiPlugin.getComponentManifest().getComponentId();
            componentRegistryService.unregisterComponent(pluginId, componentId);
            log.info("Unregistered UI component: {} from plugin: {}", componentId, pluginId);
        }

        // Remove from loaded maps
        loadedPlugins.remove(pluginId);
        PluginClassLoader classLoader = pluginClassLoaders.remove(pluginId);
        if (classLoader != null) {
            try {
                classLoader.close();
            } catch (Exception e) {
                log.warn("Error closing classloader for plugin {}: {}", pluginId, e.getMessage());
            }
        }

        // Delete JAR file if it's a third-party plugin (not bundled)
        if (!Boolean.TRUE.equals(plugin.getIsBundled()) && plugin.getJarPath() != null) {
            File jarFile = new File(plugin.getJarPath());
            if (jarFile.exists()) {
                try {
                    Files.delete(jarFile.toPath());
                    log.info("Deleted plugin JAR file: {}", jarFile.getAbsolutePath());
                } catch (Exception e) {
                    log.warn("Could not delete plugin JAR file {}: {}", jarFile.getAbsolutePath(), e.getMessage());
                }
            }
        }

        // Clean up plugin-specific data directories
        Path pluginDataDir = Path.of(pluginDirectory, pluginId);
        if (Files.exists(pluginDataDir)) {
            try {
                deleteDirectoryRecursively(pluginDataDir);
                log.info("Deleted plugin data directory: {}", pluginDataDir);
            } catch (Exception e) {
                log.warn("Could not delete plugin data directory {}: {}", pluginDataDir, e.getMessage());
            }
        }

        // Remove from database
        pluginRepository.deleteByPluginId(pluginId);

        log.info("Plugin uninstalled successfully: {}", pluginId);
    }

    /**
     * Recursively delete a directory and all its contents
     */
    private void deleteDirectoryRecursively(Path directory) throws Exception {
        if (Files.exists(directory)) {
            Files.walk(directory)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (Exception e) {
                            log.warn("Could not delete: {}", path);
                        }
                    });
        }
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

        // Check if plugin is already loaded (e.g., from loadPluginFromJar during startup)
        if (loadedPlugins.containsKey(pluginId)) {
            log.info("Plugin {} is already loaded, just updating status", pluginId);
            plugin.activate();
            pluginRepository.save(plugin);
            return;
        }

        try {
            // 1. Validate JAR file exists
            String jarPath = plugin.getJarPath();
            if (jarPath == null || jarPath.isBlank()) {
                throw new IllegalStateException("Plugin JAR path not set for plugin: " + pluginId);
            }

            File jarFile = new File(jarPath);
            if (!jarFile.exists()) {
                throw new IllegalStateException("Plugin JAR file not found: " + jarPath);
            }

            // 2. Load plugin manifest
            PluginManifest manifest = PluginManifest.loadFromJar(jarFile);
            log.info("Activating plugin: {} v{}", manifest.getPluginName(), manifest.getVersion());

            // 3. Validate dependencies are active
            List<String> dependencies = manifest.getDependencies();
            if (dependencies != null && !dependencies.isEmpty()) {
                for (String dependency : dependencies) {
                    String depPluginId = dependency.contains(":") ? dependency.split(":")[0] : dependency;
                    Optional<Plugin> depPlugin = pluginRepository.findByPluginId(depPluginId);
                    if (depPlugin.isEmpty()) {
                        throw new IllegalStateException("Missing required dependency: " + dependency);
                    }
                    if (!depPlugin.get().isActive()) {
                        throw new IllegalStateException("Dependency not active: " + dependency + ". Activate it first.");
                    }
                }
                log.info("All dependencies are active for plugin: {}", pluginId);
            }

            // 4. Create plugin ClassLoader
            PluginClassLoader classLoader = PluginClassLoader.fromJarFile(pluginId, jarFile,
                    getClass().getClassLoader());
            pluginClassLoaders.put(pluginId, classLoader);

            // 5. Instantiate plugin class
            String mainClass = manifest.getMainClass();
            Object pluginInstance = classLoader.instantiatePluginClass(mainClass);
            log.info("Instantiated plugin class: {}", mainClass);

            // 6. Create plugin context with data directories
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

            // 7. Call plugin onLoad lifecycle hook
            if (pluginInstance instanceof dev.mainul35.cms.sdk.Plugin) {
                dev.mainul35.cms.sdk.Plugin sdkPlugin = (dev.mainul35.cms.sdk.Plugin) pluginInstance;
                sdkPlugin.onLoad(context);
                log.info("Called onLoad hook for plugin: {}", pluginId);
            }

            // 8. Register plugin entities with JPA (if any)
            if (manifest.hasEntities()) {
                for (String entityPackage : manifest.getEntityPackages()) {
                    pluginEntityRegistrar.scanAndRegisterEntities(pluginId, entityPackage, classLoader);
                }
                log.info("Registered entities for plugin: {}", pluginId);
            }

            // 9. Register plugin Spring components (controllers, services, repositories)
            if (manifest.hasSpringComponents()) {
                String[] packagesToScan = manifest.getComponentScanPackages().toArray(new String[0]);
                if (packagesToScan.length > 0) {
                    pluginControllerRegistrar.registerPluginComponents(pluginId, classLoader, packagesToScan);
                    log.info("Registered Spring components for plugin: {}", pluginId);
                }
            }

            // 10. Call plugin onActivate lifecycle hook
            if (pluginInstance instanceof dev.mainul35.cms.sdk.Plugin) {
                dev.mainul35.cms.sdk.Plugin sdkPlugin = (dev.mainul35.cms.sdk.Plugin) pluginInstance;
                sdkPlugin.onActivate(context);
                log.info("Called onActivate hook for plugin: {}", pluginId);
            }

            // 11. Register UI component(s) if applicable
            if (pluginInstance instanceof UIComponentPlugin uiPlugin) {
                for (ComponentManifest componentManifest : uiPlugin.getComponentManifests()) {
                    componentRegistryService.registerComponent(componentManifest);
                    log.info("Registered UI component: {} from plugin: {}",
                            componentManifest.getComponentId(), pluginId);
                }
            }

            // 12. Store loaded plugin and update status
            loadedPlugins.put(pluginId, pluginInstance);
            plugin.activate();
            pluginRepository.save(plugin);

            log.info("Plugin activated successfully: {}", pluginId);
        } catch (Exception e) {
            log.error("Failed to activate plugin: {}", pluginId, e);
            // Clean up on failure
            cleanupFailedActivation(pluginId);
            plugin.setError();
            pluginRepository.save(plugin);
            throw new RuntimeException("Failed to activate plugin: " + pluginId, e);
        }
    }

    /**
     * Clean up resources after a failed plugin activation
     */
    private void cleanupFailedActivation(String pluginId) {
        try {
            // Remove from loaded plugins
            loadedPlugins.remove(pluginId);

            // Close and remove classloader
            PluginClassLoader classLoader = pluginClassLoaders.remove(pluginId);
            if (classLoader != null) {
                try {
                    classLoader.close();
                } catch (Exception e) {
                    log.warn("Error closing classloader for failed plugin {}: {}", pluginId, e.getMessage());
                }
            }

            // Unregister any components that might have been partially registered
            if (pluginControllerRegistrar.hasRegisteredControllers(pluginId)) {
                pluginControllerRegistrar.unregisterControllers(pluginId);
            }
            if (pluginEntityRegistrar.hasRegisteredEntities(pluginId)) {
                pluginEntityRegistrar.unregisterEntities(pluginId);
            }
        } catch (Exception e) {
            log.warn("Error during cleanup of failed activation for plugin {}: {}", pluginId, e.getMessage());
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
            // Unregister plugin controllers from main Spring MVC
            if (pluginControllerRegistrar.hasRegisteredControllers(pluginId)) {
                pluginControllerRegistrar.unregisterControllers(pluginId);
            }

            // Unregister plugin entities
            if (pluginEntityRegistrar.hasRegisteredEntities(pluginId)) {
                pluginEntityRegistrar.unregisterEntities(pluginId);
            }

            // Destroy plugin Spring ApplicationContext
            if (pluginContextManager.hasPluginContext(pluginId)) {
                pluginContextManager.destroyPluginContext(pluginId);
            }

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

    /**
     * Get the ClassLoader for a specific plugin.
     * Used by PluginAssetService to serve frontend assets from plugin JARs.
     *
     * @param pluginId The plugin ID
     * @return The PluginClassLoader, or null if not found
     */
    public PluginClassLoader getPluginClassLoader(String pluginId) {
        return pluginClassLoaders.get(pluginId);
    }
}
