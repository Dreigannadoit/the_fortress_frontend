package com.utr.gameapi.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class ActiveSkillsRequest {
    @NotNull
    private List<String> activeSkillIds;
}