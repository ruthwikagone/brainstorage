package com.brainstorage.controller;

import com.brainstorage.entity.Document;
import com.brainstorage.service.DocumentService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;

@RestController
@RequestMapping("/api/docs")
@CrossOrigin
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file) throws Exception {

        String path = "uploads/" + file.getOriginalFilename();
        file.transferTo(new File(path));

        Document doc = new Document();
        doc.setFileName(file.getOriginalFilename());
        doc.setFilePath(path);

        service.save(doc);
        return "Uploaded";
    }
}