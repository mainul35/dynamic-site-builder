package dev.mainul35.cms.plugin.core;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages dynamic registration of REST controllers from plugins.
 * This component registers plugin controllers with the main Spring MVC
 * RequestMappingHandlerMapping so they can handle HTTP requests.
 *
 * It also handles instantiation and dependency injection for plugin
 * services and repositories using the main application context.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PluginControllerRegistrar {

    private final ApplicationContext applicationContext;
    private final EntityManager entityManager;

    /**
     * Map of plugin ID to list of registered controller beans
     */
    private final Map<String, List<Object>> pluginControllers = new ConcurrentHashMap<>();

    /**
     * Map of plugin ID to list of registered bean names (for unregistration)
     */
    private final Map<String, List<String>> pluginBeanNames = new ConcurrentHashMap<>();

    /**
     * Map of plugin ID to instantiated beans
     */
    private final Map<String, Map<Class<?>, Object>> pluginBeans = new ConcurrentHashMap<>();

    /**
     * Register controllers, services, and repositories from plugin packages
     *
     * @param pluginId      Unique plugin identifier
     * @param classLoader   Plugin's ClassLoader
     * @param basePackages  Packages to scan
     */
    public void registerPluginComponents(String pluginId, ClassLoader classLoader, String[] basePackages) {
        log.info("Registering plugin components for: {}", pluginId);

        try {
            Map<Class<?>, Object> beanMap = new HashMap<>();
            List<Object> controllers = new ArrayList<>();
            List<Object> newControllers = new ArrayList<>(); // Controllers that need MVC registration
            List<String> beanNames = new ArrayList<>();

            // Get the bean factory from the main context
            ConfigurableApplicationContext configContext = (ConfigurableApplicationContext) applicationContext;
            DefaultListableBeanFactory beanFactory = (DefaultListableBeanFactory) configContext.getBeanFactory();
            AutowireCapableBeanFactory autowireFactory = applicationContext.getAutowireCapableBeanFactory();

            // Create JPA repository factory
            JpaRepositoryFactory repositoryFactory = new JpaRepositoryFactory(entityManager);

            // Scan for classes in base packages
            for (String basePackage : basePackages) {
                log.info("Scanning package: {} for plugin: {}", basePackage, pluginId);
                List<Class<?>> classes = scanPackageForClasses(classLoader, basePackage);
                log.info("Found {} classes in package: {}", classes.size(), basePackage);
                for (Class<?> clazz : classes) {
                    log.debug("  - Found class: {}", clazz.getName());
                }

                // First pass: Create repositories (both JPA interfaces and JDBC-based classes)
                for (Class<?> clazz : classes) {
                    // Handle JPA Repository interfaces
                    if (clazz.isInterface() && JpaRepository.class.isAssignableFrom(clazz)) {
                        try {
                            @SuppressWarnings("unchecked")
                            Object repository = repositoryFactory.getRepository((Class<JpaRepository<?, ?>>) clazz);
                            beanMap.put(clazz, repository);

                            String beanName = generateBeanName(pluginId, clazz);
                            beanFactory.registerSingleton(beanName, repository);
                            beanNames.add(beanName);

                            log.info("Registered JPA repository: {} for plugin: {}", clazz.getSimpleName(), pluginId);
                        } catch (Exception e) {
                            log.error("Failed to create JPA repository: {}", clazz.getName(), e);
                        }
                    }
                    // Handle JDBC-based repositories (classes annotated with @Repository)
                    else if (clazz.isAnnotationPresent(Repository.class) && !clazz.isInterface()) {
                        try {
                            Object repository = instantiateWithDependencies(clazz, beanMap, autowireFactory);
                            beanMap.put(clazz, repository);

                            String beanName = generateBeanName(pluginId, clazz);
                            beanFactory.registerSingleton(beanName, repository);
                            beanNames.add(beanName);

                            log.info("Registered JDBC repository: {} for plugin: {}", clazz.getSimpleName(), pluginId);
                        } catch (Exception e) {
                            log.error("Failed to create JDBC repository: {}", clazz.getName(), e);
                        }
                    }
                }

                // Second pass: Create services (skip if already managed by Spring via @ComponentScan)
                for (Class<?> clazz : classes) {
                    if (clazz.isAnnotationPresent(Service.class) && !clazz.isInterface()) {
                        // Check if Spring already created this bean via @ComponentScan
                        Object existingBean = findExistingBean(clazz);
                        if (existingBean != null) {
                            beanMap.put(clazz, existingBean);
                            log.info("Using existing Spring-managed service: {} for plugin: {}", clazz.getSimpleName(), pluginId);
                            continue;
                        }

                        try {
                            Object service = instantiateWithDependencies(clazz, beanMap, autowireFactory);
                            beanMap.put(clazz, service);

                            String beanName = generateBeanName(pluginId, clazz);
                            beanFactory.registerSingleton(beanName, service);
                            beanNames.add(beanName);

                            log.info("Registered service: {} for plugin: {}", clazz.getSimpleName(), pluginId);
                        } catch (Exception e) {
                            log.error("Failed to create service: {}", clazz.getName(), e);
                        }
                    }
                }

                // Third pass: Create controllers (skip if already managed by Spring via @ComponentScan)
                for (Class<?> clazz : classes) {
                    if (clazz.isAnnotationPresent(RestController.class)) {
                        // Check if Spring already created this bean via @ComponentScan
                        Object existingBean = findExistingBean(clazz);
                        if (existingBean != null) {
                            beanMap.put(clazz, existingBean);
                            controllers.add(existingBean);
                            // Spring-managed controllers are already registered with MVC, no need to register again
                            log.info("Using existing Spring-managed controller: {} for plugin: {}", clazz.getSimpleName(), pluginId);
                            continue;
                        }

                        try {
                            Object controller = instantiateWithDependencies(clazz, beanMap, autowireFactory);
                            beanMap.put(clazz, controller);
                            controllers.add(controller);
                            newControllers.add(controller); // Only new controllers need MVC registration

                            String beanName = generateBeanName(pluginId, clazz);
                            beanFactory.registerSingleton(beanName, controller);
                            beanNames.add(beanName);

                            log.info("Registered controller: {} for plugin: {}", clazz.getSimpleName(), pluginId);
                        } catch (Exception e) {
                            log.error("Failed to create controller: {}", clazz.getName(), e);
                        }
                    }
                }
            }

            // Register only NEW controllers with Spring MVC (Spring-managed ones are already registered)
            if (!newControllers.isEmpty()) {
                registerControllersWithMvc(newControllers);
            }

            // Store for later cleanup
            pluginControllers.put(pluginId, controllers);
            pluginBeanNames.put(pluginId, beanNames);
            pluginBeans.put(pluginId, beanMap);

            log.info("Registered {} controller(s), {} total beans for plugin: {}",
                    controllers.size(), beanMap.size(), pluginId);

        } catch (Exception e) {
            log.error("Failed to register plugin components: {}", pluginId, e);
            throw new RuntimeException("Failed to register plugin components: " + pluginId, e);
        }
    }

    /**
     * Register all controllers found in a plugin's Spring context
     *
     * @param pluginId      Unique plugin identifier
     * @param pluginContext The plugin's Spring ApplicationContext
     */
    public void registerControllersFromContext(String pluginId, ApplicationContext pluginContext) {
        log.info("Scanning for controllers in plugin: {}", pluginId);

        try {
            // Get the main RequestMappingHandlerMapping from the parent context
            RequestMappingHandlerMapping handlerMapping = applicationContext.getBean(RequestMappingHandlerMapping.class);

            // Find all beans annotated with @RestController in the plugin context
            Map<String, Object> controllers = pluginContext.getBeansWithAnnotation(RestController.class);

            if (controllers.isEmpty()) {
                log.info("No controllers found in plugin: {}", pluginId);
                return;
            }

            List<Object> registeredControllers = new ArrayList<>();

            for (Map.Entry<String, Object> entry : controllers.entrySet()) {
                String beanName = entry.getKey();
                Object controller = entry.getValue();
                Class<?> controllerClass = controller.getClass();

                try {
                    // Register the controller with the main handler mapping
                    registerController(handlerMapping, controller);

                    registeredControllers.add(controller);

                    log.info("Registered controller: {} from plugin: {}", controllerClass.getName(), pluginId);
                } catch (Exception e) {
                    log.error("Failed to register controller {} from plugin: {}", beanName, pluginId, e);
                }
            }

            // Store for later unregistration
            pluginControllers.put(pluginId, registeredControllers);

            log.info("Registered {} controller(s) for plugin: {}", registeredControllers.size(), pluginId);

        } catch (Exception e) {
            log.error("Failed to register controllers for plugin: {}", pluginId, e);
            throw new RuntimeException("Failed to register plugin controllers: " + pluginId, e);
        }
    }

    /**
     * Register controllers with Spring MVC
     */
    private void registerControllersWithMvc(List<Object> controllers) {
        RequestMappingHandlerMapping handlerMapping = applicationContext.getBean(RequestMappingHandlerMapping.class);

        for (Object controller : controllers) {
            registerController(handlerMapping, controller);
        }
    }

    /**
     * Register a single controller with the RequestMappingHandlerMapping
     */
    private void registerController(RequestMappingHandlerMapping handlerMapping, Object controller) {
        Class<?> controllerClass = controller.getClass();

        // Use reflection to call the protected detectHandlerMethods
        try {
            Method detectHandlerMethods = RequestMappingHandlerMapping.class.getDeclaredMethod(
                    "detectHandlerMethods", Object.class);
            detectHandlerMethods.setAccessible(true);
            detectHandlerMethods.invoke(handlerMapping, controller);
        } catch (Exception e) {
            log.error("Failed to detect handler methods for controller: {}", controllerClass.getName(), e);
            throw new RuntimeException("Failed to register controller: " + controllerClass.getName(), e);
        }
    }

    /**
     * Instantiate a class with constructor dependency injection
     */
    private Object instantiateWithDependencies(Class<?> clazz, Map<Class<?>, Object> beanMap,
                                                AutowireCapableBeanFactory autowireFactory) throws Exception {
        Constructor<?>[] constructors = clazz.getConstructors();

        // Find a suitable constructor
        for (Constructor<?> constructor : constructors) {
            Class<?>[] paramTypes = constructor.getParameterTypes();
            Object[] args = new Object[paramTypes.length];
            boolean canInstantiate = true;

            for (int i = 0; i < paramTypes.length; i++) {
                Object dependency = findDependency(paramTypes[i], beanMap);
                if (dependency != null) {
                    args[i] = dependency;
                } else {
                    canInstantiate = false;
                    break;
                }
            }

            if (canInstantiate) {
                Object instance = constructor.newInstance(args);
                // Allow autowiring of field and setter injections
                autowireFactory.autowireBean(instance);
                return instance;
            }
        }

        throw new RuntimeException("Cannot instantiate " + clazz.getName() + ": no suitable constructor found");
    }

    /**
     * Find a dependency from bean map or application context
     */
    private Object findDependency(Class<?> type, Map<Class<?>, Object> beanMap) {
        // First check plugin beans
        for (Map.Entry<Class<?>, Object> entry : beanMap.entrySet()) {
            if (type.isAssignableFrom(entry.getKey())) {
                return entry.getValue();
            }
        }

        // Then check application context
        try {
            return applicationContext.getBean(type);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Find an existing bean in the application context by type.
     * Used to detect beans already created by Spring's @ComponentScan.
     */
    private Object findExistingBean(Class<?> type) {
        try {
            return applicationContext.getBean(type);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Scan a package for classes
     */
    private List<Class<?>> scanPackageForClasses(ClassLoader classLoader, String packageName) {
        List<Class<?>> classes = new ArrayList<>();

        try {
            String path = packageName.replace('.', '/');
            log.info("Looking for resources at path: {}", path);
            java.util.Enumeration<java.net.URL> resources = classLoader.getResources(path);

            int resourceCount = 0;
            while (resources.hasMoreElements()) {
                java.net.URL resource = resources.nextElement();
                resourceCount++;
                log.info("Found resource URL: {} (protocol: {})", resource, resource.getProtocol());
                scanResource(classLoader, resource, packageName, classes);
            }
            log.info("Total resources found for path {}: {}", path, resourceCount);
        } catch (Exception e) {
            log.error("Failed to scan package: {}", packageName, e);
        }

        return classes;
    }

    /**
     * Scan a resource for classes
     */
    private void scanResource(ClassLoader classLoader, java.net.URL resource, String packageName,
                              List<Class<?>> classes) {
        try {
            String protocol = resource.getProtocol();

            if ("jar".equals(protocol)) {
                // Handle JAR files
                // URL format: jar:file:/path/to/file.jar!/package/path
                String urlPath = resource.getPath();
                if (urlPath.contains("!")) {
                    String jarUrlPart = urlPath.substring(0, urlPath.indexOf("!"));
                    // Convert file URL to path - handle Windows paths correctly
                    java.net.URL jarUrl = new java.net.URL(jarUrlPart);
                    java.io.File jarFile = new java.io.File(jarUrl.toURI());
                    String jarPath = jarFile.getAbsolutePath();

                    try (java.util.jar.JarFile jar = new java.util.jar.JarFile(jarPath)) {
                        java.util.Enumeration<java.util.jar.JarEntry> entries = jar.entries();
                        String packagePath = packageName.replace('.', '/');

                        while (entries.hasMoreElements()) {
                            java.util.jar.JarEntry entry = entries.nextElement();
                            String name = entry.getName();

                            if (name.startsWith(packagePath) && name.endsWith(".class")) {
                                String className = name.replace('/', '.').replace(".class", "");
                                try {
                                    Class<?> clazz = classLoader.loadClass(className);
                                    classes.add(clazz);
                                } catch (Exception e) {
                                    log.debug("Could not load class: {}", className);
                                }
                            }
                        }
                    }
                }
            } else if ("file".equals(protocol)) {
                // Handle file system
                java.io.File directory = new java.io.File(resource.toURI());
                scanDirectory(classLoader, directory, packageName, classes);
            }
        } catch (Exception e) {
            log.error("Failed to scan resource: {}", resource, e);
        }
    }

    /**
     * Scan a directory for classes
     */
    private void scanDirectory(ClassLoader classLoader, java.io.File directory, String packageName,
                               List<Class<?>> classes) {
        if (!directory.exists()) return;

        java.io.File[] files = directory.listFiles();
        if (files == null) return;

        for (java.io.File file : files) {
            if (file.isDirectory()) {
                scanDirectory(classLoader, file, packageName + "." + file.getName(), classes);
            } else if (file.getName().endsWith(".class")) {
                String className = packageName + "." + file.getName().replace(".class", "");
                try {
                    Class<?> clazz = classLoader.loadClass(className);
                    classes.add(clazz);
                } catch (Exception e) {
                    log.debug("Could not load class: {}", className);
                }
            }
        }
    }

    /**
     * Generate a unique bean name for a plugin class
     */
    private String generateBeanName(String pluginId, Class<?> clazz) {
        return pluginId + "." + clazz.getSimpleName();
    }

    /**
     * Unregister all controllers for a plugin
     *
     * @param pluginId Unique plugin identifier
     */
    public void unregisterControllers(String pluginId) {
        log.info("Unregistering controllers for plugin: {}", pluginId);

        List<Object> controllers = pluginControllers.remove(pluginId);
        List<String> beanNames = pluginBeanNames.remove(pluginId);
        pluginBeans.remove(pluginId);

        if (controllers == null || controllers.isEmpty()) {
            log.warn("No controllers found for plugin: {}", pluginId);
            return;
        }

        try {
            RequestMappingHandlerMapping handlerMapping = applicationContext.getBean(RequestMappingHandlerMapping.class);

            // Unregister controller mappings from Spring MVC
            for (Object controller : controllers) {
                handlerMapping.getHandlerMethods().forEach((mappingInfo, handlerMethod) -> {
                    if (handlerMethod.getBean().equals(controller) ||
                        handlerMethod.getBeanType().equals(controller.getClass())) {
                        try {
                            handlerMapping.unregisterMapping(mappingInfo);
                            log.debug("Unregistered mapping: {}", mappingInfo);
                        } catch (Exception e) {
                            log.warn("Failed to unregister mapping: {}", mappingInfo, e);
                        }
                    }
                });
            }

            // Remove beans from the application context
            if (beanNames != null && applicationContext instanceof ConfigurableApplicationContext) {
                DefaultListableBeanFactory beanFactory = (DefaultListableBeanFactory)
                        ((ConfigurableApplicationContext) applicationContext).getBeanFactory();

                for (String beanName : beanNames) {
                    try {
                        if (beanFactory.containsSingleton(beanName)) {
                            beanFactory.destroySingleton(beanName);
                            log.debug("Removed bean: {}", beanName);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to remove bean: {}", beanName, e);
                    }
                }
            }

            log.info("Unregistered {} controller(s) for plugin: {}", controllers.size(), pluginId);

        } catch (Exception e) {
            log.error("Failed to unregister controllers for plugin: {}", pluginId, e);
        }
    }

    /**
     * Get all registered controllers for a plugin
     *
     * @param pluginId Unique plugin identifier
     * @return List of controller beans
     */
    public List<Object> getPluginControllers(String pluginId) {
        return new ArrayList<>(pluginControllers.getOrDefault(pluginId, new ArrayList<>()));
    }

    /**
     * Get all registered plugin IDs
     *
     * @return Set of plugin IDs that have registered controllers
     */
    public Set<String> getRegisteredPluginIds() {
        return pluginControllers.keySet();
    }

    /**
     * Check if a plugin has registered controllers
     *
     * @param pluginId Unique plugin identifier
     * @return true if plugin has registered controllers
     */
    public boolean hasRegisteredControllers(String pluginId) {
        List<Object> controllers = pluginControllers.get(pluginId);
        return controllers != null && !controllers.isEmpty();
    }

    /**
     * Get total count of registered controllers across all plugins
     *
     * @return Total controller count
     */
    public int getTotalControllerCount() {
        return pluginControllers.values().stream()
                .mapToInt(List::size)
                .sum();
    }
}
