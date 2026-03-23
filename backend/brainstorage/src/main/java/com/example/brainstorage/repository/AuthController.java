package com.brainstorage.controller;

import com.brainstorage.entity.User;
import com.brainstorage.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {

    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    // REGISTER
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return service.register(user);
    }

    // LOGIN
    @PostMapping("/login")
    public String login(@RequestBody User request) {

        User user = service.login(request.getEmail(), request.getPassword());

        return "Login successful for: " + user.getName();
    }
}