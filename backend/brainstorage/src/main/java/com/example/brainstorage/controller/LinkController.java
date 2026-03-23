package com.brainstorage.controller;

import com.brainstorage.entity.Link;
import com.brainstorage.service.LinkService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/links")
@CrossOrigin
public class LinkController {

    private final LinkService service;

    public LinkController(LinkService service) {
        this.service = service;
    }

    @PostMapping
    public Link save(@RequestBody Link l) {
        return service.save(l);
    }

    @GetMapping
    public List<Link> getAll() {
        return service.getAll();
    }
}