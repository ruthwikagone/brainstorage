package com.brainstorage.service;

import com.brainstorage.entity.Note;
import com.brainstorage.repository.NoteRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NoteService {

    private final NoteRepository repo;

    public NoteService(NoteRepository repo) {
        this.repo = repo;
    }

    public Note save(Note n) { return repo.save(n); }

    public List<Note> getAll() { return repo.findAll(); }

    public void delete(Long id) { repo.deleteById(id); }
}