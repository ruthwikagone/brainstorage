package com.brainstorage.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 5000)
    private String content;

    private String tags;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}