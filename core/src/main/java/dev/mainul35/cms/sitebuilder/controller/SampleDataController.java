package dev.mainul35.cms.sitebuilder.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Sample Data Controller - Provides demo data endpoints for Repeater components.
 *
 * This controller demonstrates how to create API endpoints that work with the
 * Repeater component's data source configuration.
 *
 * Usage in Repeater:
 * - Endpoint: /api/sample/products
 * - Data Path: items (or leave empty if response is array)
 * - Item Variable: item (then use {{item.name}}, {{item.price}}, etc.)
 */
@RestController
@RequestMapping("/api/sample")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class SampleDataController {

    /**
     * Get sample products
     * Configure Repeater with:
     * - Endpoint: /api/sample/products
     * - Data Path: items
     */
    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        log.debug("Fetching sample products - page: {}, limit: {}", page, limit);

        List<Map<String, Object>> products = new ArrayList<>();

        products.add(createProduct(1L, "Wireless Headphones", "High-quality wireless headphones with noise cancellation", 149.99, "https://picsum.photos/seed/headphones/300/200", "Electronics", 4.5, 128));
        products.add(createProduct(2L, "Smart Watch", "Feature-rich smartwatch with health monitoring", 299.99, "https://picsum.photos/seed/watch/300/200", "Electronics", 4.7, 256));
        products.add(createProduct(3L, "Laptop Stand", "Ergonomic aluminum laptop stand", 49.99, "https://picsum.photos/seed/stand/300/200", "Accessories", 4.3, 89));
        products.add(createProduct(4L, "USB-C Hub", "7-in-1 USB-C hub with HDMI and card reader", 79.99, "https://picsum.photos/seed/hub/300/200", "Accessories", 4.6, 312));
        products.add(createProduct(5L, "Mechanical Keyboard", "RGB mechanical keyboard with Cherry MX switches", 129.99, "https://picsum.photos/seed/keyboard/300/200", "Electronics", 4.8, 445));
        products.add(createProduct(6L, "Webcam HD", "1080p HD webcam with built-in microphone", 89.99, "https://picsum.photos/seed/webcam/300/200", "Electronics", 4.4, 167));

        Map<String, Object> response = new HashMap<>();
        response.put("items", products);
        response.put("total", products.size());
        response.put("page", page);
        response.put("limit", limit);

        return ResponseEntity.ok(response);
    }

    /**
     * Get sample team members
     * Configure Repeater with:
     * - Endpoint: /api/sample/team
     * - Data Path: members
     */
    @GetMapping("/team")
    public ResponseEntity<Map<String, Object>> getTeamMembers() {

        log.debug("Fetching sample team members");

        List<Map<String, Object>> members = new ArrayList<>();

        members.add(createTeamMember(1L, "Sarah Johnson", "CEO & Founder", "https://randomuser.me/api/portraits/women/1.jpg", "sarah@example.com", "Leading our company vision and strategy"));
        members.add(createTeamMember(2L, "Michael Chen", "CTO", "https://randomuser.me/api/portraits/men/2.jpg", "michael@example.com", "Driving technical innovation and architecture"));
        members.add(createTeamMember(3L, "Emily Rodriguez", "Head of Design", "https://randomuser.me/api/portraits/women/3.jpg", "emily@example.com", "Creating beautiful user experiences"));
        members.add(createTeamMember(4L, "David Kim", "Lead Developer", "https://randomuser.me/api/portraits/men/4.jpg", "david@example.com", "Building robust and scalable solutions"));
        members.add(createTeamMember(5L, "Lisa Thompson", "Marketing Director", "https://randomuser.me/api/portraits/women/5.jpg", "lisa@example.com", "Growing our brand and community"));
        members.add(createTeamMember(6L, "James Wilson", "Product Manager", "https://randomuser.me/api/portraits/men/6.jpg", "james@example.com", "Shaping product roadmap and features"));

        Map<String, Object> response = new HashMap<>();
        response.put("members", members);
        response.put("total", members.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Get sample blog posts
     * Configure Repeater with:
     * - Endpoint: /api/sample/posts
     * - Data Path: posts
     */
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getBlogPosts(
            @RequestParam(required = false) String category) {

        log.debug("Fetching sample blog posts - category: {}", category);

        List<Map<String, Object>> posts = new ArrayList<>();

        posts.add(createBlogPost(1L, "Getting Started with React", "A comprehensive guide to building modern web applications with React", "Technology", "2024-01-15", "https://picsum.photos/seed/react/600/400", "Sarah Johnson", 5));
        posts.add(createBlogPost(2L, "UI Design Best Practices", "Learn the principles of creating intuitive and beautiful user interfaces", "Design", "2024-01-12", "https://picsum.photos/seed/design/600/400", "Emily Rodriguez", 8));
        posts.add(createBlogPost(3L, "The Future of AI", "Exploring how artificial intelligence is transforming industries", "Technology", "2024-01-10", "https://picsum.photos/seed/ai/600/400", "Michael Chen", 12));
        posts.add(createBlogPost(4L, "Remote Work Tips", "Maximize your productivity while working from home", "Lifestyle", "2024-01-08", "https://picsum.photos/seed/remote/600/400", "Lisa Thompson", 6));
        posts.add(createBlogPost(5L, "Building Scalable APIs", "Best practices for designing RESTful APIs that scale", "Technology", "2024-01-05", "https://picsum.photos/seed/api/600/400", "David Kim", 15));

        // Filter by category if provided
        List<Map<String, Object>> filteredPosts = posts;
        if (category != null && !category.isEmpty()) {
            filteredPosts = posts.stream()
                    .filter(post -> category.equalsIgnoreCase((String) post.get("category")))
                    .toList();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", filteredPosts);
        response.put("total", filteredPosts.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Get sample testimonials
     * Configure Repeater with:
     * - Endpoint: /api/sample/testimonials
     * - Data Path: (empty - response is array)
     */
    @GetMapping("/testimonials")
    public ResponseEntity<List<Map<String, Object>>> getTestimonials() {

        log.debug("Fetching sample testimonials");

        List<Map<String, Object>> testimonials = new ArrayList<>();

        testimonials.add(createTestimonial(1L, "This product has completely transformed how we work. Highly recommended!", "John Smith", "CEO, TechCorp", "https://randomuser.me/api/portraits/men/10.jpg", 5));
        testimonials.add(createTestimonial(2L, "Outstanding customer support and an intuitive interface. Love it!", "Maria Garcia", "Designer, CreativeStudio", "https://randomuser.me/api/portraits/women/11.jpg", 5));
        testimonials.add(createTestimonial(3L, "We've seen a 40% increase in productivity since adopting this solution.", "Robert Brown", "CTO, StartupXYZ", "https://randomuser.me/api/portraits/men/12.jpg", 4));
        testimonials.add(createTestimonial(4L, "The best investment we've made for our business this year.", "Jennifer Lee", "Founder, GrowthLabs", "https://randomuser.me/api/portraits/women/13.jpg", 5));

        return ResponseEntity.ok(testimonials);
    }

    /**
     * Get sample services/features
     * Configure Repeater with:
     * - Endpoint: /api/sample/services
     * - Data Path: services
     */
    @GetMapping("/services")
    public ResponseEntity<Map<String, Object>> getServices() {

        log.debug("Fetching sample services");

        List<Map<String, Object>> services = new ArrayList<>();

        services.add(createService(1L, "Web Development", "Custom web applications built with modern technologies", "🌐", "#4F46E5"));
        services.add(createService(2L, "Mobile Apps", "Native and cross-platform mobile applications", "📱", "#10B981"));
        services.add(createService(3L, "Cloud Solutions", "Scalable cloud infrastructure and deployment", "☁️", "#F59E0B"));
        services.add(createService(4L, "UI/UX Design", "Beautiful and intuitive user interface design", "🎨", "#EC4899"));
        services.add(createService(5L, "Consulting", "Expert technical consulting and architecture review", "💡", "#8B5CF6"));
        services.add(createService(6L, "Support", "24/7 technical support and maintenance", "🛠️", "#06B6D4"));

        Map<String, Object> response = new HashMap<>();
        response.put("services", services);
        response.put("total", services.size());

        return ResponseEntity.ok(response);
    }

    // Helper methods to create sample data

    private Map<String, Object> createProduct(Long id, String name, String description, double price, String image, String category, double rating, int reviews) {
        Map<String, Object> product = new LinkedHashMap<>();
        product.put("id", id);
        product.put("name", name);
        product.put("description", description);
        product.put("price", price);
        product.put("image", image);
        product.put("category", category);
        product.put("rating", rating);
        product.put("reviews", reviews);
        product.put("inStock", true);
        return product;
    }

    private Map<String, Object> createTeamMember(Long id, String name, String role, String avatar, String email, String bio) {
        Map<String, Object> member = new LinkedHashMap<>();
        member.put("id", id);
        member.put("name", name);
        member.put("role", role);
        member.put("avatar", avatar);
        member.put("email", email);
        member.put("bio", bio);
        return member;
    }

    private Map<String, Object> createBlogPost(Long id, String title, String excerpt, String category, String date, String image, String author, int readTime) {
        Map<String, Object> post = new LinkedHashMap<>();
        post.put("id", id);
        post.put("title", title);
        post.put("excerpt", excerpt);
        post.put("category", category);
        post.put("date", date);
        post.put("image", image);
        post.put("author", author);
        post.put("readTime", readTime);
        return post;
    }

    private Map<String, Object> createTestimonial(Long id, String quote, String name, String title, String avatar, int rating) {
        Map<String, Object> testimonial = new LinkedHashMap<>();
        testimonial.put("id", id);
        testimonial.put("quote", quote);
        testimonial.put("name", name);
        testimonial.put("title", title);
        testimonial.put("avatar", avatar);
        testimonial.put("rating", rating);
        return testimonial;
    }

    private Map<String, Object> createService(Long id, String name, String description, String icon, String color) {
        Map<String, Object> service = new LinkedHashMap<>();
        service.put("id", id);
        service.put("name", name);
        service.put("description", description);
        service.put("icon", icon);
        service.put("color", color);
        return service;
    }
}
