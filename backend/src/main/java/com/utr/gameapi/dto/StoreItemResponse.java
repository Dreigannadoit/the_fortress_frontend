package com.utr.gameapi.dto;

import lombok.Data;

@Data
public class StoreItemResponse {
    private String id;
    private String name;
    private int price;
    private String description;
    private String category;
    private boolean available;
}
