package com.example.pricing.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PricingInquiryController {
  @GetMapping("/pricing-inquiry")
  public String pricingInquiry() {
    return "pricing-inquiry";
  }
}
