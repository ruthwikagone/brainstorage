package com.brainstorage.controller;

import com.brainstorage.entity.Expense;
import com.brainstorage.entity.User;
import com.brainstorage.repository.UserRepository;
import com.brainstorage.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin
public class ExpenseController {

    private final ExpenseService service;
    private final UserRepository userRepository;

    public ExpenseController(ExpenseService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody Expense request) {
        if (request.getUser() == null || request.getUser().getId() == null) {
            return ResponseEntity.badRequest().body("User id is required");
        }

        User user = userRepository.findById(request.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Expense expense;
        if (request.getId() != null) {
            expense = service.getById(request.getId())
                    .orElseThrow(() -> new RuntimeException("Expense not found"));
        } else {
            expense = new Expense();
        }

        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDate(request.getDate());
        expense.setUser(user);

        return ResponseEntity.ok(service.save(expense));
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAll(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return ResponseEntity.ok(service.getByUserId(userId));
        }

        return ResponseEntity.ok(service.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        Expense expense = service.getById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (userId != null) {
            if (expense.getUser() == null || !expense.getUser().getId().equals(userId)) {
                return ResponseEntity.status(403).body("You can delete only your own expense");
            }
        }

        service.delete(id);
        return ResponseEntity.ok("Expense deleted successfully");
    }
}
