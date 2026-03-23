package com.brainstorage.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Link {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String url;
    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}