package com.example.pricing.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PricingInquiryController {
  @Value("${api.base-url:}")
  private String apiBaseUrl;

  @GetMapping("/pricing-inquiry")
  public String pricingInquiry() {
    return "pricing-inquiry";
  }

  @GetMapping("/margin-funding-maintenance")
  public String marginFundingMaintenance() {
    return "margin-funding-maintenance";
  }

  @GetMapping("/margin-funding-customer-maintenance")
  public String marginFundingCustomerMaintenance() {
    return "margin-funding-customer-maintenance";
  }

  @GetMapping("/cams-eligibility")
  public String camsEligibility() {
    return "pricing/cams-eligibility";
  }

  @GetMapping("/manage-kvi-recommendation-logic-view-output-data")
  public String manageKviRecommendationLogicViewOutputData(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-kvi-recommendation-logic-view-output-data";
  }

  @GetMapping("/manage-kvi-recommendation-logic-view-output-data/add")
  public String manageKviRecommendationLogicAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-kvi-recommendation-logic-add";
  }

  @GetMapping("/manage-kvi-mapping-logic-view-output-data")
  public String manageKviMappingLogicViewOutputData(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-kvi-mapping-logic-view-output-data";
  }

  @GetMapping("/manage-kvi-mapping-logic-view-output-data/add")
  public String manageKviMappingLogicAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-kvi-mapping-logic-add";
  }

  @GetMapping("/manage-mck-brand-logic")
  public String manageMckBrandLogic(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-mck-brand-logic";
  }

  @GetMapping({"/manage-kvi-input-view-input-data", "/manageKVIInputAndViewInputData"})
  public String manageKviInputViewInputData(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-kvi-input-view-input-data";
  }

  @GetMapping("/kvi-input-exclusion/add")
  public String kviInputExclusionAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "kvi-input-exclusion-add";
  }

  @GetMapping("/price-rules-reason-codes")
  public String priceRulesReasonCodes() {
    return "pricing/price-rules-reason-codes";
  }

  @GetMapping("/price-rules-reason-codes/add")
  public String priceRulesReasonCodesAdd() {
    return "pricing/price-rules-reason-codes-add";
  }

  @GetMapping("/adjustments/customer-gpo-adjustments/add")
  public String customerGpoAdjustmentsAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "customer-gpo-adjustments-add";
  }

  @GetMapping("/")
  public String home() {
    return "home";
  }
}
