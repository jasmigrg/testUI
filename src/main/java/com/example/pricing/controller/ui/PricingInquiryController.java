package com.example.pricing.controller.ui;

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
    return "pricing/pricing-inquiry";
  }

  @GetMapping("/margin-funding-maintenance")
  public String marginFundingMaintenance() {
    return "pricing/margin-funding-maintenance";
  }

  @GetMapping("/margin-funding-customer-maintenance")
  public String marginFundingCustomerMaintenance() {
    return "pricing/margin-funding-customer-maintenance";
  }

  @GetMapping("/cams-eligibility")
  public String camsEligibility() {
    return "pricing/cams-eligibility";
  }

  @GetMapping("/manage-kvi-recommendation-logic-view-output-data")
  public String manageKviRecommendationLogicViewOutputData(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "guidance-model-management/manage-kvi-recommendation-logic-view-output-data";
  }

  @GetMapping("/manage-kvi-recommendation-logic-view-output-data/add")
  public String manageKviRecommendationLogicAdd(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "guidance-model-management/manage-kvi-recommendation-logic-add";
  }

  @GetMapping("/manage-mck-brand-logic")
  public String manageMckBrandLogic(Model model) {
    model.addAttribute("apiBaseUrl", apiBaseUrl);
    return "guidance-model-management/manage-mck-brand-logic";
  }

  @GetMapping("/price-rules-reason-codes")
  public String priceRulesReasonCodes() {
    return "pricing/price-rules-reason-codes";
  }

  @GetMapping("/price-rules-reason-codes/add")
  public String priceRulesReasonCodesAdd() {
    return "pricing/price-rules-reason-codes-add";
  }

  @GetMapping("/")
  public String home() {
    return "home";
  }
}
