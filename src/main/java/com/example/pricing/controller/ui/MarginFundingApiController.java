package com.example.pricing.controller.ui;

import com.example.pricing.service.MarginFundingBffService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MarginFundingApiController {
  private static final DateTimeFormatter UI_DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");
  private final MarginFundingBffService bffService;

  public MarginFundingApiController(MarginFundingBffService bffService) {
    this.bffService = bffService;
  }

  @GetMapping("/api/margin-funding/paginated")
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

    return bffService.search(page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }

  @GetMapping("/api/margin-funding/customer-maintenance/paginated")
  public Map<String, Object> getCustomerMaintenancePage(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) Integer pageNum,
      @RequestParam(required = false) Integer pageLimit,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String sortDirection,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction,
      @RequestParam Map<String, String> params) {

    return bffService.searchCustomerMaintenance(
        page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }

  @PostMapping("/api/margin-funding/disable")
  public ResponseEntity<Map<String, Object>> disableItems(@RequestBody Map<String, Object> payload) {
    List<String> uniqueKeys = extractUniqueKeys(payload);
    String notes = asString(payload.get("notes"));
    if (uniqueKeys.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", "At least one row must be selected"));
    }
    if (isBlank(notes)) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Notes is required"));
    }
    if (bffService.hasDisabledItems(uniqueKeys)) {
      return ResponseEntity.badRequest()
          .body(Map.of("success", false, "message", "Disabled rows cannot be edited"));
    }
    return ResponseEntity.ok(bffService.disableItems(uniqueKeys, notes));
  }

  @PostMapping("/api/margin-funding/update-termination-date")
  public ResponseEntity<Map<String, Object>> updateItemTerminationDate(@RequestBody Map<String, Object> payload) {
    List<String> uniqueKeys = extractUniqueKeys(payload);
    String terminationDate = asString(payload.get("terminationDate"));
    String notes = asString(payload.get("notes"));
    if (uniqueKeys.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", "At least one row must be selected"));
    }
    if (bffService.hasDisabledItems(uniqueKeys)) {
      return ResponseEntity.badRequest()
          .body(Map.of("success", false, "message", "Disabled rows cannot be edited"));
    }
    String validationError = validateTerminationUpdateInput(terminationDate, notes);
    if (validationError != null) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", validationError));
    }
    return ResponseEntity.ok(bffService.updateItemTerminationDate(uniqueKeys, terminationDate, notes));
  }

  @PostMapping("/api/margin-funding/customer-maintenance/disable")
  public ResponseEntity<Map<String, Object>> disableCustomerMaintenance(@RequestBody Map<String, Object> payload) {
    List<String> uniqueKeys = extractUniqueKeys(payload);
    String notes = asString(payload.get("notes"));
    if (uniqueKeys.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", "At least one row must be selected"));
    }
    if (isBlank(notes)) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Notes is required"));
    }
    if (bffService.hasDisabledCustomerMaintenance(uniqueKeys)) {
      return ResponseEntity.badRequest()
          .body(Map.of("success", false, "message", "Disabled rows cannot be edited"));
    }
    return ResponseEntity.ok(bffService.disableCustomerMaintenance(uniqueKeys, notes));
  }

  @PostMapping("/api/margin-funding/customer-maintenance/update-termination-date")
  public ResponseEntity<Map<String, Object>> updateCustomerTerminationDate(@RequestBody Map<String, Object> payload) {
    List<String> uniqueKeys = extractUniqueKeys(payload);
    String terminationDate = asString(payload.get("terminationDate"));
    String notes = asString(payload.get("notes"));
    if (uniqueKeys.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", "At least one row must be selected"));
    }
    if (bffService.hasDisabledCustomerMaintenance(uniqueKeys)) {
      return ResponseEntity.badRequest()
          .body(Map.of("success", false, "message", "Disabled rows cannot be edited"));
    }
    String validationError = validateTerminationUpdateInput(terminationDate, notes);
    if (validationError != null) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", validationError));
    }
    return ResponseEntity.ok(
        bffService.updateCustomerTerminationDate(uniqueKeys, terminationDate, notes));
  }

  @SuppressWarnings("unchecked")
  private List<String> extractUniqueKeys(Map<String, Object> payload) {
    Object rawKeys = payload.get("uniqueKeys");
    if (rawKeys instanceof List<?>) {
      return ((List<?>) rawKeys).stream().map(String::valueOf).toList();
    }
    return List.of();
  }

  private String asString(Object value) {
    return value == null ? null : String.valueOf(value);
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isBlank();
  }

  private String validateTerminationUpdateInput(String terminationDate, String notes) {
    if (isBlank(terminationDate)) {
      return "Termination Date is required";
    }
    if (isBlank(notes)) {
      return "Notes is required";
    }

    LocalDate parsedDate;
    try {
      parsedDate = LocalDate.parse(terminationDate.trim(), UI_DATE_FMT);
    } catch (DateTimeParseException ex) {
      return "Termination Date must be in MM/DD/YYYY format";
    }

    if (parsedDate.isBefore(LocalDate.now())) {
      return "Termination Date must be today or a future date";
    }
    return null;
  }
}
