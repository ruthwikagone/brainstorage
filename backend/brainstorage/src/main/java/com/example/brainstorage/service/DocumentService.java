package com.brainstorage.service;

import com.brainstorage.entity.Document;
import com.brainstorage.repository.DocumentRepository;
import org.springframework.stereotype.Service;

@Service
public class DocumentService {

    private final DocumentRepository repo;

    public DocumentService(DocumentRepository repo) {
        this.repo = repo;
    }

    public Document save(Document d) { return repo.save(d); }
}