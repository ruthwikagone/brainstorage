package com.brainstorage.service;

import com.brainstorage.entity.Link;
import com.brainstorage.repository.LinkRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LinkService {

    private final LinkRepository repo;

    public LinkService(LinkRepository repo) {
        this.repo = repo;
    }

    public Link save(Link l) { return repo.save(l); }
    public List<Link> getAll() { return repo.findAll(); }
}