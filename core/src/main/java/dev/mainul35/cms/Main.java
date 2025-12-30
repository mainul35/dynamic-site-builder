package dev.mainul35.cms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"dev.mainul35.cms", "dev.mainul35.plugins"})
@EntityScan(basePackages = {"dev.mainul35.cms", "dev.mainul35.plugins.entities"})
@EnableJpaRepositories(basePackages = {"dev.mainul35.cms", "dev.mainul35.plugins"})
public class Main {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}
