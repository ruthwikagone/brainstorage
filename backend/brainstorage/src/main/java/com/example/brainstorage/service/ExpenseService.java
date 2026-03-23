package com.brainstorage.service;

import com.brainstorage.entity.Expense;
import com.brainstorage.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository repo;

    public ExpenseService(ExpenseRepository repo) {
        this.repo = repo;
    }

    public Expense save(Expense e) { return repo.save(e); }
    public List<Expense> getAll() { return repo.findAll(); }
    public List<Expense> getByUserId(Long userId) { return repo.findByUserId(userId); }
    public Optional<Expense> getById(Long id) { return repo.findById(id); }
    public void delete(Long id) { repo.deleteById(id); }
}
