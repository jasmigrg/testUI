package com.example.pricing.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;

@Service
public class MarginFundingBffService {
  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");
  private static final Set<String> CONTROL_PARAMS = Set.of(
      "page", "size", "pageNum", "pageLimit", "sortBy", "sortDirection", "sort", "direction");

  private final List<Map<String, Object>> stubRows = IntStream.rangeClosed(1, 250)
      .mapToObj(this::buildRow)
      .collect(Collectors.toList());
  private final List<Map<String, Object>> customerMaintenanceStubRows = IntStream.rangeClosed(1, 250)
      .mapToObj(this::buildCustomerMaintenanceRow)
      .collect(Collectors.toList());

  public Map<String, Object> disableItems(List<String> uniqueKeys, String notes) {
    return applyDisable(stubRows, uniqueKeys, notes);
  }

  public Map<String, Object> disableCustomerMaintenance(List<String> uniqueKeys, String notes) {
    return applyDisable(customerMaintenanceStubRows, uniqueKeys, notes);
  }

  public Map<String, Object> updateItemTerminationDate(
      List<String> uniqueKeys, String terminationDate, String notes) {
    return applyTerminationDateUpdate(stubRows, uniqueKeys, terminationDate, notes);
  }

  public Map<String, Object> updateCustomerTerminationDate(
      List<String> uniqueKeys, String terminationDate, String notes) {
    return applyTerminationDateUpdate(customerMaintenanceStubRows, uniqueKeys, terminationDate, notes);
  }

  public boolean hasDisabledItems(List<String> uniqueKeys) {
    return hasDisabledRows(stubRows, uniqueKeys);
  }

  public boolean hasDisabledCustomerMaintenance(List<String> uniqueKeys) {
    return hasDisabledRows(customerMaintenanceStubRows, uniqueKeys);
  }

  public Map<String, Object> search(
      Integer page,
      Integer size,
      Integer pageNum,
      Integer pageLimit,
      String sortBy,
      String sortDirection,
      String sort,
      String direction,
      Map<String, String> params) {
    return searchDataset(
        stubRows, page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }

  public Map<String, Object> searchCustomerMaintenance(
      Integer page,
      Integer size,
      Integer pageNum,
      Integer pageLimit,
      String sortBy,
      String sortDirection,
      String sort,
      String direction,
      Map<String, String> params) {
    return searchDataset(
        customerMaintenanceStubRows, page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }

  private Map<String, Object> searchDataset(
      List<Map<String, Object>> dataset,
      Integer page,
      Integer size,
      Integer pageNum,
      Integer pageLimit,
      String sortBy,
      String sortDirection,
      String sort,
      String direction,
      Map<String, String> params) {
    // TODO(backend-integration): replace stubRows/filtering with a microservice call and
    // map response to {content,totalElements,page,size} (and optionally {data,total}).

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

    List<Map<String, Object>> filtered = new ArrayList<>(dataset);
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
    // Keep alternate shape too for compatibility with existing grids.
    response.put("data", content);
    response.put("total", total);
    return response;
  }

  private Map<String, Object> applyDisable(List<Map<String, Object>> dataset, List<String> uniqueKeys, String notes) {
    Set<String> keys = sanitizeKeys(uniqueKeys);
    int updatedCount = 0;
    String today = LocalDate.now().format(DATE_FMT);
    String noteValue = (notes == null || notes.isBlank()) ? "Disabled" : notes.trim();

    for (Map<String, Object> row : dataset) {
      if (!keys.contains(String.valueOf(row.get("uniqueKey")))) {
        continue;
      }
      row.put("disableDate", today);
      row.put("notes", noteValue);
      updatedCount++;
    }

    return Map.of("success", true, "updatedCount", updatedCount, "disableDate", today);
  }

  private boolean hasDisabledRows(List<Map<String, Object>> dataset, List<String> uniqueKeys) {
    Set<String> keys = sanitizeKeys(uniqueKeys);
    if (keys.isEmpty()) {
      return false;
    }
    return dataset.stream()
        .filter(row -> keys.contains(String.valueOf(row.get("uniqueKey"))))
        .anyMatch(row -> {
          Object disableDate = row.get("disableDate");
          return disableDate != null && !String.valueOf(disableDate).trim().isBlank();
        });
  }

  private Map<String, Object> applyTerminationDateUpdate(
      List<Map<String, Object>> dataset, List<String> uniqueKeys, String terminationDate, String notes) {
    Set<String> keys = sanitizeKeys(uniqueKeys);
    int updatedCount = 0;
    String resolvedTerminationDate =
        (terminationDate == null || terminationDate.isBlank()) ? "" : terminationDate.trim();
    String noteValue =
        (notes == null || notes.isBlank()) ? "Termination date updated" : notes.trim();

    for (Map<String, Object> row : dataset) {
      if (!keys.contains(String.valueOf(row.get("uniqueKey")))) {
        continue;
      }
      row.put("terminationDate", resolvedTerminationDate);
      row.put("notes", noteValue);
      updatedCount++;
    }

    return Map.of(
        "success", true, "updatedCount", updatedCount, "terminationDate", resolvedTerminationDate);
  }

  private Set<String> sanitizeKeys(List<String> uniqueKeys) {
    if (uniqueKeys == null) {
      return Set.of();
    }
    return uniqueKeys.stream()
        .filter(key -> key != null && !key.isBlank())
        .map(String::trim)
        .collect(Collectors.toCollection(HashSet::new));
  }

  private void applySort(List<Map<String, Object>> rows, String sortBy, String direction) {
    if (sortBy == null || sortBy.isBlank()) {
      return;
    }
    Comparator<Map<String, Object>> comparator = (left, right) ->
        compare(left.get(sortBy), right.get(sortBy));

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
    String value = fieldValue == null ? "" : String.valueOf(fieldValue).trim();
    String filter = filterValue == null ? "" : filterValue.trim();
    String op = operator == null ? "contains" : operator.trim();

    if ("blank".equalsIgnoreCase(op)) {
      return value.isBlank();
    }
    if ("notBlank".equalsIgnoreCase(op)) {
      return !value.isBlank();
    }

    if ("contains".equalsIgnoreCase(op)) {
      return value.toLowerCase().contains(filter.toLowerCase());
    }

    if ("equals".equalsIgnoreCase(op)) {
      return value.equalsIgnoreCase(filter);
    }
    if ("notEqual".equalsIgnoreCase(op)) {
      return !value.equalsIgnoreCase(filter);
    }

    int cmp = compare(value, filter);
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

    return value.toLowerCase().contains(filter.toLowerCase());
  }

  private int compare(Object left, Object right) {
    String l = left == null ? "" : String.valueOf(left).trim();
    String r = right == null ? "" : String.valueOf(right).trim();

    BigDecimal lNum = parseNumber(l);
    BigDecimal rNum = parseNumber(r);
    if (lNum != null && rNum != null) {
      return lNum.compareTo(rNum);
    }

    LocalDate lDate = parseDate(l);
    LocalDate rDate = parseDate(r);
    if (lDate != null && rDate != null) {
      return lDate.compareTo(rDate);
    }

    return l.compareToIgnoreCase(r);
  }

  private BigDecimal parseNumber(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return new BigDecimal(value);
    } catch (Exception ignored) {
      return null;
    }
  }

  private LocalDate parseDate(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return LocalDate.parse(value, DATE_FMT);
    } catch (Exception ignored) {
      return null;
    }
  }

  private Map<String, Object> buildRow(int i) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("uniqueKey", "UK-" + (1000 + i));
    row.put("vendorFamilyNumber", "VF-" + (200 + (i % 6)));
    row.put("vendorFamilyName", "Vendor Family " + String.valueOf((char) ('A' + (i % 6))));
    row.put("vendorProgram", "Program " + (1 + (i % 4)));
    row.put("itemNumber", String.valueOf(10000 + i));
    row.put("itemDescription", "Item Description " + i);
    row.put("distributionNonContract", String.format("%.2f", (5 + (i % 3)) * 1.0));
    row.put("distributionContract", String.format("%.2f", (3 + (i % 4)) * 1.0));
    row.put("marginFundingPercentType", i % 2 == 0 ? "Flat" : "Tiered");
    row.put("effectiveFrom", "01/01/2026");
    row.put("effectiveThru", "12/31/2026");
    row.put("notes", "");
    row.put("disableDate", "");
    row.put("terminationDate", "");
    row.put("userId", "USER" + (100 + (i % 8)));
    row.put("dateUpdated", "01/15/2026");
    row.put("timeUpdated", String.format("%02d:30:00", 9 + (i % 8)));
    row.put("workStnId", "WS" + (200 + (i % 6)));
    row.put("programId", "PGM-" + (3000 + (i % 12)));
    return row;
  }

  private Map<String, Object> buildCustomerMaintenanceRow(int i) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("uniqueKey", "UK-" + (5000 + i));
    row.put("vendorProgram", "Program " + (1 + (i % 4)));
    row.put("vendorFamilyNumber", "VF-" + (200 + (i % 6)));
    row.put("vendorFamilyName", "Vendor Family " + String.valueOf((char) ('A' + (i % 6))));
    row.put("accountType", i % 2 == 0 ? "Ship-To" : "Bill-To");
    row.put("customerNumber", String.valueOf(700000 + i));
    row.put("customerName", "Customer " + i);
    row.put("ieFlag", i % 3 == 0 ? "E" : "I");
    row.put("effectiveFrom", "01/01/2026");
    row.put("effectiveThru", "12/31/2026");
    row.put("notes", "");
    row.put("disableDate", "");
    row.put("terminationDate", "");
    row.put("programId", "PGM-" + (3000 + (i % 12)));
    row.put("workStnId", "WS" + (200 + (i % 6)));
    row.put("userId", "USER" + (100 + (i % 8)));
    return row;
  }
}
