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

  @GetMapping("/all-guidance-inquiry")
  public String allGuidanceInquiry(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "all-guidance-inquiry";
  }

  @GetMapping("/margin-funding-maintenance")
  public String marginFundingMaintenance(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-maintenance";
  }

  @GetMapping("/margin-funding-maintenance/add")
  public String marginFundingMaintenanceAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-maintenance-add";
  }

  @GetMapping("/margin-funding-customer-maintenance")
  public String marginFundingCustomerMaintenance(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-customer-maintenance";
  }

  @GetMapping("/margin-funding-customer-maintenance/add")
  public String marginFundingCustomerMaintenanceAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-customer-maintenance-add";
  }

  @GetMapping("/margin-funding-contract-maintenance")
  public String marginFundingContractMaintenance(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-contract-maintenance";
  }

  @GetMapping("/margin-funding-contract-maintenance/add")
  public String marginFundingContractMaintenanceAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-contract-maintenance-add";
  }

  @GetMapping("/margin-funding-price-maintenance")
  public String marginFundingPriceMaintenance(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-price-maintenance";
  }

  @GetMapping("/margin-funding-price-maintenance/add")
  public String marginFundingPriceMaintenanceAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "margin-funding-price-maintenance-add";
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

  @GetMapping("/manage-mck-brand-logic/add/weighting")
  public String manageMckBrandLogicWeightingAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-mck-brand-logic-weighting-add";
  }

  @GetMapping("/manage-mck-brand-logic/add/quality-tier")
  public String manageMckBrandLogicQualityTierAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-mck-brand-logic-quality-tier-add";
  }

  @GetMapping("/manage-mck-brand-logic/add/relative-delta")
  public String manageMckBrandLogicRelativeDeltaAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-mck-brand-logic-relative-delta-add";
  }

  @GetMapping("/manage-mck-brand-logic/add/price-cap")
  public String manageMckBrandLogicPriceCapAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-mck-brand-logic-price-cap-add";
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

  @GetMapping("/manage-uom-diff-input-view-input-data")
  public String manageUomDiffInputViewInputData(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-uom-diff-input-view-input-data";
  }

  @GetMapping("/manage-uom-diff-input-view-input-data/exclusion/add")
  public String manageUomDiffInputExclusionAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "manage-uom-diff-input-exclusion-add";
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
