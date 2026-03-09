package com.example.pricing.service;

import java.math.BigDecimal;
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
import org.springframework.stereotype.Service;

@Service
public class KviRecommendationBffService {
  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");
  private static final Set<String> CONTROL_PARAMS =
      Set.of("page", "size", "pageNum", "pageLimit", "sortBy", "sortDirection", "sort", "direction");

  private final List<Map<String, Object>> parameterRows =
      IntStream.rangeClosed(1, 120).mapToObj(this::buildParameterRow).collect(Collectors.toList());
  private final List<Map<String, Object>> outputRows =
      IntStream.rangeClosed(1, 300).mapToObj(this::buildOutputRow).collect(Collectors.toList());

  public Map<String, Object> searchParameter(
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
        parameterRows, page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }

  public Map<String, Object> searchOutput(
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
        outputRows, page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
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
    // TODO(backend-integration): replace stub dataset/filtering with downstream KVI service call.
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
    response.put("data", content);
    response.put("total", total);
    return response;
  }

  private void applySort(List<Map<String, Object>> rows, String sortBy, String direction) {
    if (sortBy == null || sortBy.isBlank()) {
      return;
    }
    Comparator<Map<String, Object>> comparator = (left, right) -> compare(left.get(sortBy), right.get(sortBy));
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
      String sanitized = value.replace("%", "").replace(",", "");
      return new BigDecimal(sanitized);
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

  private Map<String, Object> buildParameterRow(int i) {
    String[] methods = {"Highest PRCA", "Lowest PRCA", "Latest Effective", "Manual Override"};
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("effectiveDate", String.format("%02d/01/2026", 1 + (i % 12)));
    row.put("terminationDate", String.format("12/%02d/2026", 10 + (i % 18)));
    row.put("prcaMinThreshold", String.format("%.2f", 4.5 + (i * 0.65)));
    row.put("dedupMethod", methods[i % methods.length]);
    return row;
  }

  private Map<String, Object> buildOutputRow(int i) {
    String[] categories = {"Surgical", "Lab", "Office", "Pharma"};
    String[] groups = {"Group A", "Group B", "Group C"};
    String[] segments = {"Core", "Value", "Strategic"};

    Map<String, Object> row = new LinkedHashMap<>();
    row.put("prcaNum", "PRCA-" + (1200 + i));
    row.put("customerCluster", "Cluster " + String.valueOf((char) ('A' + (i % 5))));
    row.put("effectiveDate", String.format("01/%02d/2026", 1 + (i % 28)));
    row.put("itemNum", String.valueOf(500000 + i));
    row.put("itemFamily", "Family " + (1 + (i % 7)));
    row.put("itemCategory", categories[i % categories.length]);
    row.put("itemGroup", groups[i % groups.length]);
    row.put("itemSubCategory", "SubCat " + (1 + (i % 6)));
    row.put("itemDescription", "KVI Recommended Item " + i);
    row.put("itemSegmentation", segments[i % segments.length]);
    row.put("finalBaseMargin", String.format("%.2f%%", 12 + ((i % 9) * 0.9)));
    row.put("finalPremiumMargin", String.format("%.2f%%", 18 + ((i % 11) * 0.85)));
    return row;
  }
}
