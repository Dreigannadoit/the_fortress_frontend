package com.utr.gameapi.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Test if API is working
@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now, refine in production
@RestController
@RequestMapping("/public")

public class TestController {
    @GetMapping("/test")
    public String test() {
        return "API is working!";
    }
}
