package com.example.pricing.controller.ui;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MockPricingApiController {
  private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("MM/dd/yyyy");
  private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
  private static final String ERR_INVALID_CUSTOMER = "Error Message - Invalid Customer/Ship-To Account";
  private static final String ERR_INVALID_ITEM = "Error Message - Invalid Item Number";
  private static final String ERR_ITEM_MASTER_NOT_FOUND = "Error Message - Item Master Record Not Found";
  private static final String ERR_INVALID_DATE = "Error Message - Date Changed is Invalid";
  private static final Map<String, String> ITEM_CUSTOMER = Map.of(
      "10001", "CUST-4392",
      "10002", "CUST-5577",
      "10003", "CUST-7721");
  private static final Map<String, String> ITEM_CAT = Map.of(
      "10001", "CAT-8821",
      "10002", "CAT-6630",
      "10003", "CAT-7710");

  @GetMapping("/api/pricing-inquiry")
  public Map<String, Object> pricingInquiry(
      @RequestParam(required = false) String customer,
      @RequestParam(required = false) String itemNumber,
      @RequestParam(required = false) String catNumber,
      @RequestParam(required = false) String priceDate) {
    String normalizedCustomer = trimToEmpty(customer);
    String normalizedItem = trimToEmpty(itemNumber);
    String normalizedCat = trimToEmpty(catNumber);
    String normalizedDate = trimToEmpty(priceDate);

    if (normalizedCustomer.isEmpty()) {
      return error("customer", ERR_INVALID_CUSTOMER);
    }
    if (normalizedItem.isEmpty()) {
      return error("itemNumber", ERR_INVALID_ITEM);
    }
    if (normalizedDate.isEmpty()) {
      return error("priceDate", ERR_INVALID_DATE);
    }
    if (!ITEM_CUSTOMER.containsKey(normalizedItem)) {
      return error("itemNumber", ERR_INVALID_ITEM);
    }
    String expectedCustomer = ITEM_CUSTOMER.get(normalizedItem);
    if (!expectedCustomer.equalsIgnoreCase(normalizedCustomer)) {
      return error("customer", ERR_INVALID_CUSTOMER);
    }
    String expectedCat = ITEM_CAT.get(normalizedItem);
    if (!normalizedCat.isEmpty() && !expectedCat.equalsIgnoreCase(normalizedCat)) {
      return error("catNumber", ERR_ITEM_MASTER_NOT_FOUND);
    }

    LocalDate parsedDate = parseDateStrict(normalizedDate);
    if (parsedDate == null) {
      return error("priceDate", ERR_INVALID_DATE);
    }
    return buildMock(normalizedItem, parsedDate);
  }

  private Map<String, Object> buildMock(String itemNumber, LocalDate date) {
    Map<String, Object> root = new LinkedHashMap<>();
    int itemIdx = itemNumber.equals("10002") ? 2 : itemNumber.equals("10003") ? 3 : 1;

    // Inputs
    put(root, "inputs.customer", ITEM_CUSTOMER.get(itemNumber));
    put(root, "inputs.itemNumber", itemNumber);
    put(root, "inputs.catNumber", ITEM_CAT.get(itemNumber));
    put(root, "inputs.orderQty", itemIdx == 3 ? "2" : "1");
    put(root, "inputs.uom", itemIdx == 2 ? "BX" : "EA");
    put(root, "inputs.priceDate", date.format(DISPLAY_DATE));
    put(root, "inputs.priceDateIso", date.format(ISO_DATE));

    // Customer
    put(root, "customer.name", itemIdx == 2 ? "Northlake Medical" : itemIdx == 3 ? "City General" : "Parkview Health");
    put(root, "customer.billTo1", "BT-100");
    put(root, "customer.billTo2", "Parkview");
    put(root, "customer.billTo3", "PCCA-01");
    put(root, "customer.prca1", "PRCA-21");
    put(root, "customer.prca2", "Parkview");
    put(root, "customer.prca3", "PCCA-01");
    put(root, "customer.segment", "Hospital");
    put(root, "customer.cluster", "Midwest");
    put(root, "customer.market", "Acute Care");
    put(root, "customer.fssGrp", "FSS-3");
    put(root, "customer.billToPricing", true);
    put(root, "customer.fssType", "FSS-Type A");
    put(root, "customer.multiBillToPrca", true);
    put(root, "customer.governmentDept", "State Health");
    put(root, "customer.primaryGpoAffiliation", "Vizient");

    // Item
    put(root, "item.description", itemIdx == 2 ? "IV Tubing Set" : itemIdx == 3 ? "Gauze Pads 4x4" : "Sterile Syringe 10ml");
    put(root, "item.supplierName", itemIdx == 2 ? "HealthSource" : itemIdx == 3 ? "CarePlus" : "MedSupply Inc.");
    put(root, "item.supplierNumber", itemIdx == 2 ? "SUP-2244" : itemIdx == 3 ? "SUP-9911" : "SUP-7788");
    put(root, "item.mckessonBrand", true);
    put(root, "item.salesGroup", "SG-12");
    put(root, "item.stockingType", itemIdx == 3 ? "Non-Stock" : "Stocked");
    put(root, "item.compCategory", itemIdx == 2 ? "Supplies" : "Medical");
    put(root, "item.productFamily1", "Syringes");
    put(root, "item.productFamily2", "Sterile");
    put(root, "item.productCategory1", "Injection");
    put(root, "item.productCategory2", "Disposable");

    // Price Breakdown - Pricing Info
    put(root, "priceBreakdown.pricingInfo.sellPrice",
        adjustByDate(itemIdx == 2 ? 18.20 : itemIdx == 3 ? 12.40 : 24.50, date));
    put(root, "priceBreakdown.pricingInfo.compMargin", "5.2%"
        );
    put(root, "priceBreakdown.pricingInfo.pricingMargin", "7.8%"
        );
    put(root, "priceBreakdown.pricingInfo.costPlus", "3.0%"
        );
    put(root, "priceBreakdown.pricingInfo.govtListPrice",
        adjustByDate(itemIdx == 2 ? 19.50 : itemIdx == 3 ? 13.10 : 26.00, date));
    put(root, "priceBreakdown.pricingInfo.lastPricePaid",
        adjustByDate(itemIdx == 2 ? 17.80 : itemIdx == 3 ? 12.00 : 23.75, date));
    put(root, "priceBreakdown.pricingInfo.ceilingPrice",
        adjustByDate(itemIdx == 2 ? 19.00 : itemIdx == 3 ? 12.80 : 25.00, date));
    put(root, "priceBreakdown.pricingInfo.floorPrice",
        adjustByDate(itemIdx == 2 ? 16.90 : itemIdx == 3 ? 11.90 : 22.50, date));

    // Price Breakdown - Price Rule
    put(root, "priceBreakdown.priceRule.id", "PR-8891");
    put(root, "priceBreakdown.priceRule.levelSmall", "50");
    put(root, "priceBreakdown.priceRule.levelWide", "Standard");
    put(root, "priceBreakdown.priceRule.type", "Contract");
    put(root, "priceBreakdown.priceRule.shipToPricing", true);
    put(root, "priceBreakdown.priceRule.markup", "2.5%"
        );
    put(root, "priceBreakdown.priceRule.applyLoadsToPricingCost", true);
    put(root, "priceBreakdown.priceRule.reasonCode", "RC-07");
    put(root, "priceBreakdown.priceRule.notes", "Primary contract rule");
    put(root, "priceBreakdown.priceRule.effectiveDate", "01/01/2025");
    put(root, "priceBreakdown.priceRule.terminationDate", "12/31/2025");

    // Price Breakdown - UOM Differential
    put(root, "priceBreakdown.uomDifferential.exists", "Yes");
    put(root, "priceBreakdown.uomDifferential.applied", "Yes");
    put(root, "priceBreakdown.uomDifferential.notAppliedReason", ""
        );
    put(root, "priceBreakdown.uomDifferential.uniqueId", "UOM-778");
    put(root, "priceBreakdown.uomDifferential.percent", "1.5%"
        );
    put(root, "priceBreakdown.uomDifferential.amount", "0.35"
        );
    put(root, "priceBreakdown.uomDifferential.appliedAmount", "0.35"
        );

    // Price Breakdown - Pricing Cost
    put(root, "priceBreakdown.pricingCost.pricingCost", "19.40");
    put(root, "priceBreakdown.pricingCost.loadAmtValue", "0.40");
    put(root, "priceBreakdown.pricingCost.loadAmtPct", "2%"
        );
    put(root, "priceBreakdown.pricingCost.initialCostPricing", "19.00");
    put(root, "priceBreakdown.pricingCost.priceListId", "PL-551"
        );
    put(root, "priceBreakdown.pricingCost.vendorContractId", "VC-314"
        );
    put(root, "priceBreakdown.pricingCost.contractType", "GPO"
        );
    put(root, "priceBreakdown.pricingCost.gpoNumberName", "VZ-101 / Vizient"
        );
    put(root, "priceBreakdown.pricingCost.qbc", true);
    put(root, "priceBreakdown.pricingCost.lowerCostQbcValue", "0.10");
    put(root, "priceBreakdown.pricingCost.lowerCostQbcPct", "1%"
        );

    // Price Breakdown - Rebate Cost
    put(root, "priceBreakdown.rebateCost.compCost", "0.75");
    put(root, "priceBreakdown.rebateCost.loadAmtValue", "0.15");
    put(root, "priceBreakdown.rebateCost.loadAmtPct", "1%"
        );
    put(root, "priceBreakdown.rebateCost.initialCostRebate", "0.60");
    put(root, "priceBreakdown.rebateCost.costListId", "CL-220"
        );
    put(root, "priceBreakdown.rebateCost.vendorContractId", "VC-314"
        );
    put(root, "priceBreakdown.rebateCost.contractType", "Rebate"
        );
    put(root, "priceBreakdown.rebateCost.gpoNumberName", "VZ-101 / Vizient"
        );
    put(root, "priceBreakdown.rebateCost.qbc", true);
    put(root, "priceBreakdown.rebateCost.lowerCostQbcValue", "0.05");
    put(root, "priceBreakdown.rebateCost.lowerCostQbcPct", "0.5%"
        );
    put(root, "priceBreakdown.rebateCost.marginFunding", "0.30");
    put(root, "priceBreakdown.rebateCost.rebatableUsed", true);
    put(root, "priceBreakdown.rebateCost.rebatableCost", "0.55");
    put(root, "priceBreakdown.rebateCost.choice", "pricing");

    // Additional Info - UOM Price Rule Info
    put(root, "additional.uomPriceRuleInfo.uom.primary", "EA");
    put(root, "additional.uomPriceRuleInfo.uom.sell", "EA");
    put(root, "additional.uomPriceRuleInfo.uom.buy", "EA");
    put(root, "additional.uomPriceRuleInfo.priceRuleLevel.primary", "50");
    put(root, "additional.uomPriceRuleInfo.priceRuleLevel.sell", "50");
    put(root, "additional.uomPriceRuleInfo.priceRuleLevel.buy", "50");
    put(root, "additional.uomPriceRuleInfo.price.primary", "20.2500");
    put(root, "additional.uomPriceRuleInfo.price.sell", "20.2500");
    put(root, "additional.uomPriceRuleInfo.price.buy", "20.2500");
    put(root, "additional.uomPriceRuleInfo.gp.primary", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.gp.sell", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.gp.buy", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.markup.primary", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.markup.sell", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.markup.buy", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.priceRuleType.primary", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.priceRuleType.sell", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.priceRuleType.buy", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.priceRuleId.primary", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.priceRuleId.sell", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.priceRuleId.buy", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.reasonCode.primary", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.reasonCode.sell", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.reasonCode.buy", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.allowPriceOverride.primary", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.allowPriceOverride.sell", "xx.xxxxx");
    put(root, "additional.uomPriceRuleInfo.allowPriceOverride.buy", "xx.xxxxx");

    // Additional Info - UOM Pricing Cost
    put(root, "additional.uomPricingCost.initialCosts.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.initialCosts.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.initialCosts.buy", "xx.xxxxx");
    put(root, "additional.uomPricingCost.pricingCosts.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.pricingCosts.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.pricingCosts.buy", "xx.xxxxx");
    put(root, "additional.uomPricingCost.priceListId.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.priceListId.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.priceListId.buy", "xx.xxxxx");
    put(root, "additional.uomPricingCost.vendContId.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.vendContId.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.vendContId.buy", "xx.xxxxx");
    put(root, "additional.uomPricingCost.contractType.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.contractType.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.contractType.buy", "xx.xxxxx");
    put(root, "additional.uomPricingCost.gpoNumber.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.gpoNumber.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.gpoNumber.buy", "xx.xxxxx");
    put(root, "additional.uomPricingCost.gpoName.primary", "xx.xxxxx");
    put(root, "additional.uomPricingCost.gpoName.sell", "xx.xxxxx");
    put(root, "additional.uomPricingCost.gpoName.buy", "xx.xxxxx");

    // Additional Info - UOM Differential
    put(root, "additional.uomDifferential.exists", "XX");
    put(root, "additional.uomDifferential.uom.transaction", "XX");
    put(root, "additional.uomDifferential.uom.primary", "XX");
    put(root, "additional.uomDifferential.uom.sell", "XX");
    put(root, "additional.uomDifferential.appliedFlag.transaction", "XX");
    put(root, "additional.uomDifferential.appliedFlag.primary", "XX");
    put(root, "additional.uomDifferential.appliedFlag.sell", "XX");
    put(root, "additional.uomDifferential.notAppliedReason.transaction", "XX");
    put(root, "additional.uomDifferential.notAppliedReason.primary", "XX");
    put(root, "additional.uomDifferential.notAppliedReason.sell", "XX");
    put(root, "additional.uomDifferential.percent.transaction", "XX");
    put(root, "additional.uomDifferential.percent.primary", "XX");
    put(root, "additional.uomDifferential.percent.sell", "XX");
    put(root, "additional.uomDifferential.amount.transaction", "XX");
    put(root, "additional.uomDifferential.amount.primary", "XX");
    put(root, "additional.uomDifferential.amount.sell", "XX");
    put(root, "additional.uomDifferential.uniqueId.transaction", "XX");
    put(root, "additional.uomDifferential.uniqueId.primary", "XX");
    put(root, "additional.uomDifferential.uniqueId.sell", "XX");
    put(root, "additional.uomDifferential.appliedAmount.transaction", "XX");
    put(root, "additional.uomDifferential.appliedAmount.primary", "XX");
    put(root, "additional.uomDifferential.appliedAmount.sell", "XX");

    // Additional Info - UOM Conversions
    put(root, "additional.uomConversions.row1.col1", "XX");
    put(root, "additional.uomConversions.row1.col2", "XX");
    put(root, "additional.uomConversions.row1.col3", "XX");
    put(root, "additional.uomConversions.row1.col4", "XX");
    put(root, "additional.uomConversions.row2.col1", "XX");
    put(root, "additional.uomConversions.row2.col2", "XX");
    put(root, "additional.uomConversions.row2.col3", "XX");
    put(root, "additional.uomConversions.row2.col4", "XX");
    put(root, "additional.uomConversions.row3.col1", "XX");
    put(root, "additional.uomConversions.row3.col2", "XX");
    put(root, "additional.uomConversions.row3.col3", "XX");
    put(root, "additional.uomConversions.row3.col4", "XX");

    // Additional Info - QBC Info
    put(root, "additional.qbcInfo.itemUsedInQbc", "XX");

    // Govt List Price and Limits
    put(root, "govtLimits.uom.transaction", "EA");
    put(root, "govtLimits.uom.primary", "EA");
    put(root, "govtLimits.uom.sell", "EA");
    put(root, "govtLimits.uom.buy", "EA");
    put(root, "govtLimits.ceiling.transaction", "50");
    put(root, "govtLimits.ceiling.primary", "50");
    put(root, "govtLimits.ceiling.sell", "50");
    put(root, "govtLimits.ceiling.buy", "50");
    put(root, "govtLimits.ceilingLevel.transaction", "20.2500");
    put(root, "govtLimits.ceilingLevel.primary", "20.2500");
    put(root, "govtLimits.ceilingLevel.sell", "20.2500");
    put(root, "govtLimits.ceilingLevel.buy", "20.2500");
    put(root, "govtLimits.ceilingRuleId.transaction", "xx.xxxxx");
    put(root, "govtLimits.ceilingRuleId.primary", "xx.xxxxx");
    put(root, "govtLimits.ceilingRuleId.sell", "xx.xxxxx");
    put(root, "govtLimits.ceilingRuleId.buy", "xx.xxxxx");
    put(root, "govtLimits.ceilingReasonCode.transaction", "xx.xxxxx");
    put(root, "govtLimits.ceilingReasonCode.primary", "xx.xxxxx");
    put(root, "govtLimits.ceilingReasonCode.sell", "xx.xxxxx");
    put(root, "govtLimits.ceilingReasonCode.buy", "xx.xxxxx");
    put(root, "govtLimits.ceilingNotes.transaction", "xx.xxxxx");
    put(root, "govtLimits.ceilingNotes.primary", "xx.xxxxx");
    put(root, "govtLimits.ceilingNotes.sell", "xx.xxxxx");
    put(root, "govtLimits.ceilingNotes.buy", "xx.xxxxx");
    put(root, "govtLimits.floor.transaction", "xx.xxxxx");
    put(root, "govtLimits.floor.primary", "xx.xxxxx");
    put(root, "govtLimits.floor.sell", "xx.xxxxx");
    put(root, "govtLimits.floor.buy", "xx.xxxxx");
    put(root, "govtLimits.floorLevel.transaction", "xx.xxxxx");
    put(root, "govtLimits.floorLevel.primary", "xx.xxxxx");
    put(root, "govtLimits.floorLevel.sell", "xx.xxxxx");
    put(root, "govtLimits.floorLevel.buy", "xx.xxxxx");
    put(root, "govtLimits.floorRuleId.transaction", "xx.xxxxx");
    put(root, "govtLimits.floorRuleId.primary", "xx.xxxxx");
    put(root, "govtLimits.floorRuleId.sell", "xx.xxxxx");
    put(root, "govtLimits.floorRuleId.buy", "xx.xxxxx");
    put(root, "govtLimits.floorReasonCode.transaction", "xx.xxxxx");
    put(root, "govtLimits.floorReasonCode.primary", "xx.xxxxx");
    put(root, "govtLimits.floorReasonCode.sell", "xx.xxxxx");
    put(root, "govtLimits.floorReasonCode.buy", "xx.xxxxx");
    put(root, "govtLimits.floorNotes.transaction", "xx.xxxxx");
    put(root, "govtLimits.floorNotes.primary", "xx.xxxxx");
    put(root, "govtLimits.floorNotes.sell", "xx.xxxxx");
    put(root, "govtLimits.floorNotes.buy", "xx.xxxxx");
    put(root, "govtLimits.govtListPrice.transaction", "xx.xxxxx");
    put(root, "govtLimits.govtListPrice.primary", "xx.xxxxx");
    put(root, "govtLimits.govtListPrice.sell", "xx.xxxxx");
    put(root, "govtLimits.govtListPrice.buy", "xx.xxxxx");

    return root;
  }

  private LocalDate parseDateStrict(String priceDate) {
    try {
      return LocalDate.parse(priceDate, ISO_DATE);
    } catch (Exception ignored) {
      return null;
    }
  }

  private Map<String, Object> error(String field, String message) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("error", message);
    result.put("field", field);
    return result;
  }

  private String trimToEmpty(String value) {
    return value == null ? "" : value.trim();
  }

  private String adjustByDate(double base, LocalDate date) {
    double delta = (date.getDayOfMonth() % 2 == 0) ? 0.15 : -0.10;
    return String.format("%.2f", base + delta);
  }

  @SuppressWarnings("unchecked")
  private void put(Map<String, Object> root, String path, Object value) {
    String[] parts = path.split("\\.");
    Map<String, Object> curr = root;
    for (int i = 0; i < parts.length - 1; i++) {
      curr = (Map<String, Object>) curr.computeIfAbsent(parts[i], k -> new LinkedHashMap<>());
    }
    curr.put(parts[parts.length - 1], value);
  }
}
