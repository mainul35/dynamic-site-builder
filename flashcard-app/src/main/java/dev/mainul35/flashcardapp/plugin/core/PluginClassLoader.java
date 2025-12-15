package dev.mainul35.flashcardapp.plugin.core;

import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom ClassLoader for loading plugin classes in isolation.
 * Each plugin gets its own ClassLoader to prevent class conflicts and allow hot-reloading.
 */
@Slf4j
public class PluginClassLoader extends URLClassLoader {

    private final String pluginId;
    private final List<String> restrictedPackages;

    /**
     * Create a new PluginClassLoader
     *
     * @param pluginId  Unique identifier for the plugin
     * @param urls      JAR files and directories to load classes from
     * @param parent    Parent ClassLoader (typically the application ClassLoader)
     */
    public PluginClassLoader(String pluginId, URL[] urls, ClassLoader parent) {
        super(urls, parent);
        this.pluginId = pluginId;
        this.restrictedPackages = initializeRestrictedPackages();
        log.debug("Created PluginClassLoader for plugin: {}", pluginId);
    }

    /**
     * Initialize list of packages that plugins cannot access directly.
     * This provides sandboxing to prevent plugins from accessing sensitive classes.
     */
    private List<String> initializeRestrictedPackages() {
        List<String> restricted = new ArrayList<>();
        // Prevent access to core system packages
        restricted.add("java.lang.reflect");
        restricted.add("sun.misc");
        // Prevent direct access to Spring Security internals
        restricted.add("org.springframework.security.crypto");
        // Add more as needed for security
        return restricted;
    }

    /**
     * Override loadClass to implement custom class loading logic
     */
    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // Check if class is in restricted package
        if (isRestricted(name)) {
            log.warn("Plugin {} attempted to load restricted class: {}", pluginId, name);
            throw new ClassNotFoundException("Access to class " + name + " is restricted for plugins");
        }

        // Try to load the class
        return super.loadClass(name, resolve);
    }

    /**
     * Check if a class name is in a restricted package
     */
    private boolean isRestricted(String className) {
        for (String restricted : restrictedPackages) {
            if (className.startsWith(restricted)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Load a class from the plugin JAR
     *
     * @param className Fully qualified class name
     * @return The loaded class
     * @throws ClassNotFoundException if the class cannot be found
     */
    public Class<?> loadPluginClass(String className) throws ClassNotFoundException {
        log.debug("Loading plugin class: {} for plugin: {}", className, pluginId);
        return loadClass(className);
    }

    /**
     * Create a new instance of a plugin class
     *
     * @param className Fully qualified class name
     * @return New instance of the class
     * @throws Exception if instantiation fails
     */
    public Object instantiatePluginClass(String className) throws Exception {
        Class<?> clazz = loadPluginClass(className);
        return clazz.getDeclaredConstructor().newInstance();
    }

    /**
     * Get the plugin ID associated with this ClassLoader
     */
    public String getPluginId() {
        return pluginId;
    }

    /**
     * Close the ClassLoader and release resources
     */
    @Override
    public void close() throws IOException {
        log.debug("Closing PluginClassLoader for plugin: {}", pluginId);
        super.close();
    }

    /**
     * Create a PluginClassLoader from a plugin JAR file
     *
     * @param pluginId    Unique plugin identifier
     * @param jarFile     Plugin JAR file
     * @param parent      Parent ClassLoader
     * @return New PluginClassLoader instance
     * @throws IOException if JAR file cannot be read
     */
    public static PluginClassLoader fromJarFile(String pluginId, File jarFile, ClassLoader parent) throws IOException {
        if (!jarFile.exists()) {
            throw new IOException("Plugin JAR file not found: " + jarFile.getAbsolutePath());
        }

        URL[] urls = new URL[]{jarFile.toURI().toURL()};
        return new PluginClassLoader(pluginId, urls, parent);
    }

    /**
     * Create a PluginClassLoader from multiple JAR files and directories
     *
     * @param pluginId    Unique plugin identifier
     * @param files       List of JAR files and directories
     * @param parent      Parent ClassLoader
     * @return New PluginClassLoader instance
     * @throws IOException if any file cannot be read
     */
    public static PluginClassLoader fromFiles(String pluginId, List<File> files, ClassLoader parent) throws IOException {
        List<URL> urls = new ArrayList<>();
        for (File file : files) {
            if (!file.exists()) {
                throw new IOException("File not found: " + file.getAbsolutePath());
            }
            urls.add(file.toURI().toURL());
        }
        return new PluginClassLoader(pluginId, urls.toArray(new URL[0]), parent);
    }
}
