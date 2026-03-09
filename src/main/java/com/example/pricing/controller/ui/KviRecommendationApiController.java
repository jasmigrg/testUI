package com.example.pricing.controller.ui;

import com.example.pricing.service.KviRecommendationBffService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class KviRecommendationApiController {
  private final KviRecommendationBffService bffService;

  public KviRecommendationApiController(KviRecommendationBffService bffService) {
    this.bffService = bffService;
  }

  @GetMapping("/api/kvi-recommendation/parameter/paginated")
  public Map<String, Object> getParameterPage(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) Integer pageNum,
      @RequestParam(required = false) Integer pageLimit,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String sortDirection,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction,
      @RequestParam Map<String, String> params) {

    return bffService.searchParameter(
        page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }

  @GetMapping("/api/kvi-recommendation/output/paginated")
  public Map<String, Object> getOutputPage(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageNum,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) Integer pageLimit,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String sortDirection,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction,
      @RequestParam Map<String, String> params) {

    return bffService.searchOutput(
        page, size, pageNum, pageLimit, sortBy, sortDirection, sort, direction, params);
  }
}
