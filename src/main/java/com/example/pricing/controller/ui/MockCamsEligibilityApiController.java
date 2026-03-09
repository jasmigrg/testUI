package com.example.pricing.controller.ui;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MockCamsEligibilityApiController {
  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");
  private static final Set<String> CONTROL_PARAMS = Set.of(
      "page", "size", "pageNum", "pageLimit", "sortBy", "sortDirection", "sort", "direction");

  private final List<Map<String, Object>> mockRows = IntStream.rangeClosed(1, 250)
      .mapToObj(this::buildRow)
      .collect(Collectors.toList());

  @GetMapping("/cams-eligible/api/paginated")
  public Map<String, Object> getPage(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) Integer pageNum,
      @RequestParam(required = false) Integer pageLimit,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String sortDirection,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction,
      @RequestParam Map<String, String> params) {

    int resolvedPage = page != null ? page : (pageNum != null ? pageNum : 0);
    int resolvedSize = size != null ? size : (pageLimit != null ? pageLimit : 20);
    if (resolvedPage < 0) {
      resolvedPage = 0;
    }
    if (resolvedSize <= 0) {
      resolvedSize = 20;
    }

    String resolvedSortBy = (sortBy == null || sortBy.isBlank()) ? sort : sortBy;
    String resolvedDirection = (sortDirection == null || sortDirection.isBlank()) ? direction : sortDirection;

    List<Map<String, Object>> filtered = new ArrayList<>(mockRows);
    applyFilters(filtered, params);
    applySort(filtered, resolvedSortBy, resolvedDirection);

    int total = filtered.size();
    int from = Math.min(resolvedPage * resolvedSize, total);
    int to = Math.min(from + resolvedSize, total);
    List<Map<String, Object>> content = filtered.subList(from, to);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("content", content);
    response.put("totalElements", total);
    response.put("page", resolvedPage);
    response.put("size", resolvedSize);
    return response;
  }

  private void applySort(List<Map<String, Object>> rows, String sortBy, String direction) {
    if (sortBy == null || sortBy.isBlank()) {
      return;
    }
    Comparator<Map<String, Object>> comparator = Comparator.comparing(
        row -> String.valueOf(row.getOrDefault(sortBy, "")),
        String.CASE_INSENSITIVE_ORDER
    );
    if ("DESC".equalsIgnoreCase(direction)) {
      comparator = comparator.reversed();
    }
    rows.sort(comparator);
  }

  private void applyFilters(List<Map<String, Object>> rows, Map<String, String> params) {
    for (Map.Entry<String, String> entry : params.entrySet()) {
      String field = entry.getKey();
      if (CONTROL_PARAMS.contains(field) || field.endsWith("_op")) {
        continue;
      }
      String rawValue = entry.getValue();
      String operator = params.getOrDefault(field + "_op", "contains");
      rows.removeIf(row -> !matches(row.get(field), rawValue, operator));
    }
  }

  private boolean matches(Object fieldValue, String filterValue, String operator) {
    String value = fieldValue == null ? "" : String.valueOf(fieldValue);
    String filter = filterValue == null ? "" : filterValue.trim();
    String op = operator == null ? "" : operator.trim();

    if ("blank".equalsIgnoreCase(op)) {
      return value.isBlank();
    }
    if ("notBlank".equalsIgnoreCase(op)) {
      return !value.isBlank();
    }

    if ("equals".equalsIgnoreCase(op)) {
      return value.equalsIgnoreCase(filter);
    }
    if ("notEqual".equalsIgnoreCase(op)) {
      return !value.equalsIgnoreCase(filter);
    }

    LocalDate leftDate = parseDate(value);
    LocalDate rightDate = parseDate(filter);
    if (leftDate != null && rightDate != null) {
      if ("greaterThan".equalsIgnoreCase(op)) {
        return leftDate.isAfter(rightDate);
      }
      if ("lessThan".equalsIgnoreCase(op)) {
        return leftDate.isBefore(rightDate);
      }
      if ("greaterThanOrEqual".equalsIgnoreCase(op)) {
        return leftDate.isAfter(rightDate) || leftDate.isEqual(rightDate);
      }
      if ("lessThanOrEqual".equalsIgnoreCase(op)) {
        return leftDate.isBefore(rightDate) || leftDate.isEqual(rightDate);
      }
    } else {
      int cmp = value.compareToIgnoreCase(filter);
      if ("greaterThan".equalsIgnoreCase(op)) {
        return cmp > 0;
      }
      if ("lessThan".equalsIgnoreCase(op)) {
        return cmp < 0;
      }
      if ("greaterThanOrEqual".equalsIgnoreCase(op)) {
        return cmp >= 0;
      }
      if ("lessThanOrEqual".equalsIgnoreCase(op)) {
        return cmp <= 0;
      }
    }

    return value.toLowerCase().contains(filter.toLowerCase());
  }

  private LocalDate parseDate(String value) {
    try {
      return LocalDate.parse(value, DATE_FMT);
    } catch (Exception ignored) {
      return null;
    }
  }

  private Map<String, Object> buildRow(int idx) {
    Map<String, Object> row = new LinkedHashMap<>();
    LocalDate baseDate = LocalDate.of(2025, 1, 1).plusDays(idx);

    row.put("uniqueKeyId", "UK-" + String.format("%06d", idx));
    row.put("mckessonContractId", "MC-" + (1000 + (idx % 90)));
    row.put("contractTierNumber", "TIER-" + ((idx % 5) + 1));
    row.put("effectiveFromDate", baseDate.minusDays(30).format(DATE_FMT));
    row.put("effectiveDate", baseDate.format(DATE_FMT));
    row.put("terminationDate", baseDate.plusDays(365).format(DATE_FMT));
    row.put("mckessonEndDate", baseDate.plusDays(400).format(DATE_FMT));
    row.put("state", switch (idx % 5) {
      case 0 -> "TX";
      case 1 -> "CA";
      case 2 -> "NY";
      case 3 -> "IL";
      default -> "FL";
    });
    row.put("gpoNumber", "GPO-" + ((idx % 40) + 1));
    row.put("addDate", baseDate.minusDays(60).format(DATE_FMT));
    row.put("gpoProgramNum", "PRG-" + ((idx % 18) + 1));
    row.put("gpoProgramSubNum", "SUB-" + ((idx % 27) + 1));
    row.put("gpoClassOfTradeNum", "COT-" + ((idx % 11) + 1));
    row.put("poolTypeNo", "PT-" + ((idx % 8) + 1));
    row.put("poolId", "POOL-" + ((idx % 55) + 1));
    row.put("reportCodeAddBook01", "RC01-" + ((idx % 9) + 1));
    row.put("reportCodeAddBook02", "RC02-" + ((idx % 9) + 1));
    row.put("reportCodeAddBook06", "RC06-" + ((idx % 9) + 1));
    row.put("documentControlNumber", "DOC-" + String.format("%07d", idx));
    row.put("ediSuccessfullyProcess", (idx % 2 == 0) ? "Y" : "N");
    row.put("includeExclude", (idx % 3 == 0) ? "Exclude" : "Include");
    row.put("deaLicenseNumber", "DEA" + String.format("%08d", idx));
    row.put("userId", "user" + ((idx % 15) + 1));
    row.put("programId", "PGM-" + ((idx % 12) + 1));
    row.put("workstationId", "WS-" + ((idx % 20) + 1));
    row.put("updatedAt", baseDate.plusDays(10).format(DATE_FMT));

    return row;
  }
}
