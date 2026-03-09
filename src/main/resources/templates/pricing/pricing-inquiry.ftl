<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pricing Inquiry</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css" />
  <link rel="stylesheet" href="${ctx}/css/pricing-inquiry.css" />
</head>
<body>
  <div class="app-shell">
    <#include "/components/header.ftl">
    <#import "/components/page-header.ftl" as pageHeader>

    <#include "/components/sidebar.ftl">
    <@navigation currentPath="/pricing-inquiry" />

    <main class="content">
      <@pageHeader.render
        title="Pricing Inquiry"
        crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Pricing Inquiry"}]
      />

      <#assign iconBack><svg class="back-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></#assign>
      <#assign iconClear><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M9 6l1-2h4l1 2M8 6l1 14h6l1-14"/></svg></#assign>
      <#assign iconForm><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM7 8h10M7 12h10M7 16h6"/></svg></#assign>
      <#assign iconTools><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-4v3m0 12v3m-9-9h3m12 0h3m-2.12-6.88l-2.12 2.12m-9.52 9.52l-2.12 2.12m0-11.64l2.12 2.12m9.52 9.52l2.12 2.12"/></svg></#assign>

      <div class="toolbar">
        <a class="tool-btn danger back-home" href="${ctx}/" aria-label="Back to Home">
          ${iconBack}
        </a>
        <button class="tool-btn" type="button" data-action="clear">
          ${iconClear}
          Clear
        </button>
        <button class="tool-btn">
          ${iconForm}
          Form
        </button>
        <button class="tool-btn">
          ${iconTools}
          Tools
        </button>
      </div>

      <section class="card-grid">
        <div class="card inputs-card">
          <h2>Inputs</h2>
          <div class="form-col">
            <div class="input-error" data-role="item-error" hidden>Item not found. Please check the Item Number.</div>
            <div class="field-row">
              <label>Customer</label>
              <input class="input-field" type="text" data-field="inputs.customer" />
            </div>
            <div class="field-row">
              <label>Item Number</label>
              <input class="input-field" type="text" data-field="inputs.itemNumber" />
            </div>
            <div class="field-row">
              <label>Cat Number</label>
              <input class="input-field" type="text" data-field="inputs.catNumber" />
            </div>
            <div class="field-row">
              <label>Order Quantity</label>
              <input class="input-field" type="text" data-field="inputs.orderQty" />
            </div>
            <div class="field-row">
              <label>UOM</label>
              <input class="input-field" type="text" data-field="inputs.uom" />
            </div>
            <div class="field-row">
              <label>Price Date</label>
              <div class="input-date">
                <input class="input-field date-display" type="text" placeholder="mm/dd/yyyy" data-field="inputs.priceDate" />
                <input class="date-hidden" type="date" aria-label="Pick date" data-field="inputs.priceDateIso" />
                <button class="calendar-btn" type="button" aria-label="Pick date"></button>
              </div>
            </div>
            <button class="primary" type="button">Get Price</button>
          </div>
        </div>

        <div class="card customer-card">
          <h2>Customer Information</h2>
          <div class="cust-grid">
            <div class="span-2">
              <div class="field-row wide-input">
                <label>Customer Name</label>
                <input class="readonly-field" type="text" readonly data-field="customer.name" />
              </div>
            </div>
            <div class="span-2">
              <div class="field-row">
                <label>Bill To, Name, PCCA</label>
                <div class="triple-input">
                  <input class="readonly-field" type="text" readonly data-field="customer.billTo1" />
                  <input class="readonly-field" type="text" readonly data-field="customer.billTo2" />
                  <input class="readonly-field" type="text" readonly data-field="customer.billTo3" />
                </div>
              </div>
            </div>
            <div class="span-2">
              <div class="field-row">
                <label>PRCA, Name, PCCA</label>
                <div class="triple-input">
                  <input class="readonly-field" type="text" readonly data-field="customer.prca1" />
                  <input class="readonly-field" type="text" readonly data-field="customer.prca2" />
                  <input class="readonly-field" type="text" readonly data-field="customer.prca3" />
                </div>
              </div>
            </div>
            <div class="field-row cust-wide-row">
              <label>Segment</label>
              <input class="readonly-field" type="text" readonly data-field="customer.segment" />
            </div>
            <div class="field-row cust-wide-row">
              <label>Cluster</label>
              <input class="readonly-field" type="text" readonly data-field="customer.cluster" />
            </div>
            <div class="field-row cust-wide-row">
              <label>Market</label>
              <input class="readonly-field" type="text" readonly data-field="customer.market" />
            </div>
            <div class="field-row cust-wide-row">
              <label>FSS Grp</label>
              <input class="readonly-field" type="text" readonly data-field="customer.fssGrp" />
            </div>
            <div class="field-check">
              <label>Bill to Pricing</label>
              <input class="chk" type="checkbox" data-field="customer.billToPricing" />
            </div>
            <div class="field-row cust-wide-row">
              <label>FSS Type</label>
              <input class="readonly-field" type="text" readonly data-field="customer.fssType" />
            </div>
            <div class="field-check">
              <label>Multi Bill to PRCA</label>
              <input class="chk" type="checkbox" data-field="customer.multiBillToPrca" />
            </div>
            <div class="field-row cust-wide-row">
              <label>Government<br />Department</label>
              <input class="readonly-field" type="text" readonly data-field="customer.governmentDept" />
            </div>
            <div class="field-row cust-wide-row">
              <label>Primary GPO<br />Affiliation</label>
              <input class="readonly-field" type="text" readonly data-field="customer.primaryGpoAffiliation" />
            </div>
          </div>
        </div>

        <div class="card item-card">
          <h2>Item Information</h2>
          <div class="form-col">
            <div class="field-row">
              <label>Item Description</label>
              <input class="readonly-field" type="text" readonly data-field="item.description" />
            </div>
            <div class="field-row">
              <label>Supplier Name</label>
              <input class="readonly-field" type="text" readonly data-field="item.supplierName" />
            </div>
            <div class="field-row">
              <label>Supplier Number</label>
              <input class="readonly-field" type="text" readonly data-field="item.supplierNumber" />
            </div>
            <div class="item-inline-row">
              <label class="inline-label">McKesson Brand</label>
              <input class="inline-check" type="checkbox" data-field="item.mckessonBrand" />
              <label class="inline-label">Sales Group</label>
              <input class="readonly-field" type="text" readonly data-field="item.salesGroup" />
            </div>
            <div class="field-row">
              <label>Stocking Type</label>
              <input class="readonly-field" type="text" readonly data-field="item.stockingType" />
            </div>
            <div class="field-row">
              <label>Comp Category</label>
              <input class="readonly-field" type="text" readonly data-field="item.compCategory" />
            </div>
            <div class="field-row">
              <label>Product Family</label>
              <div class="double-input">
                <input class="readonly-field" type="text" readonly data-field="item.productFamily1" />
                <input class="readonly-field" type="text" readonly data-field="item.productFamily2" />
              </div>
            </div>
            <div class="field-row">
              <label>Product Category</label>
              <div class="double-input">
                <input class="readonly-field" type="text" readonly data-field="item.productCategory1" />
                <input class="readonly-field" type="text" readonly data-field="item.productCategory2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="price-section" id="priceSection">
        <div class="tabs-header">
          <div class="tabs">
            <button class="tab-btn active" type="button">Price Breakdown</button>
            <button class="tab-btn" type="button">Additional Information</button>
            <button class="tab-btn" type="button">Govt List Price and Limits</button>
          </div>
          <button class="collapse-toggle" type="button" aria-expanded="true" aria-controls="priceBreakdown">
            <span class="collapse-arrow"></span>
          </button>
        </div>

        <div class="tab-panel" id="priceBreakdown">
          <div class="price-grid">
            <div class="card read-card pricing-info-card">
              <h2>Pricing Information</h2>
              <div class="form-col">
                <div class="field-row"><label>Sell Price</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.sellPrice" /></div>
                <div class="field-row"><label>Comp Margin%</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.compMargin" /></div>
                <div class="field-row"><label>Pricing Margin%</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.pricingMargin" /></div>
                <div class="field-row"><label>Cost Plus%</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.costPlus" /></div>
                <div class="field-row"><label>Govt List Price</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.govtListPrice" /></div>
                <div class="field-row"><label>Last Price Paid</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.lastPricePaid" /></div>
                <div class="field-row"><label>Ceiling/Floor<br />Price</label><div class="double-input"><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.ceilingPrice" /><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingInfo.floorPrice" /></div></div>
              </div>
            </div>

            <div class="card read-card price-rule-card">
              <h2>Price Rule Information</h2>
              <div class="form-col">
                <div class="field-row"><label>ID</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.priceRule.id" /></div>
                <div class="field-row level-row">
                  <label>Level</label>
                  <div class="level-inputs">
                    <input class="readonly-field level-small" type="text" readonly data-field="priceBreakdown.priceRule.levelSmall" />
                    <input class="readonly-field level-wide" type="text" readonly data-field="priceBreakdown.priceRule.levelWide" />
                  </div>
                </div>
                <div class="field-row inline-check-row">
                  <label>Type</label>
                  <input class="readonly-field pr-short" type="text" readonly data-field="priceBreakdown.priceRule.type" />
                  <div class="check-row">
                    <label>Ship to Pricing</label>
                    <input class="chk" type="checkbox" data-field="priceBreakdown.priceRule.shipToPricing" />
                  </div>
                </div>
                <div class="field-row inline-check-row">
                  <label>Markup%</label>
                  <input class="readonly-field pr-short" type="text" readonly data-field="priceBreakdown.priceRule.markup" />
                  <div class="check-row">
                    <label>Apply Loads to<br />Pricing Cost</label>
                    <input class="chk" type="checkbox" data-field="priceBreakdown.priceRule.applyLoadsToPricingCost" />
                  </div>
                </div>
                <div class="field-row"><label>Reason Code</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.priceRule.reasonCode" /></div>
                <div class="field-row"><label>Notes</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.priceRule.notes" /></div>
                <div class="field-row"><label>Effective Date</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.priceRule.effectiveDate" /></div>
                <div class="field-row"><label>Termination Date</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.priceRule.terminationDate" /></div>
              </div>
            </div>

            <div class="card read-card uom-card">
              <h2>UOM Differential</h2>
              <div class="form-col">
                <div class="field-row"><label>Exists</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.exists" /></div>
                <div class="field-row"><label>Applied</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.applied" /></div>
                <div class="field-row"><label>Not Applied Reason</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.notAppliedReason" /></div>
                <div class="field-row"><label>Unique ID</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.uniqueId" /></div>
                <div class="field-row"><label>Percent</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.percent" /></div>
                <div class="field-row"><label>Amount</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.amount" /></div>
                <div class="field-row"><label>Applied Amount</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.uomDifferential.appliedAmount" /></div>
              </div>
            </div>

            <div class="card read-card pricing-cost-card">
              <h2>Pricing Cost Information</h2>
              <div class="form-col">
                <div class="field-row"><label>Pricing Cost</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.pricingCost" /></div>
                <div class="field-row cost-row load-row">
                  <label>Load Amt</label>
                  <div class="cost-inputs load-inputs">
                    <input class="readonly-field cost-small" type="text" readonly data-field="priceBreakdown.pricingCost.loadAmtValue" />
                    <input class="readonly-field percent-input" type="text" placeholder="%" readonly data-field="priceBreakdown.pricingCost.loadAmtPct" />
                  </div>
                </div>
                <div class="field-row"><label>Initial<br />Cost-Pricing</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.initialCostPricing" /></div>
                <div class="field-row"><label>Price List ID</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.priceListId" /></div>
                <div class="field-row"><label>Vendor Contract ID</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.vendorContractId" /></div>
                <div class="field-row"><label>Contract Type</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.contractType" /></div>
                <div class="field-row"><label>GPO Number/<br />Name</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.gpoNumberName" /></div>
                <div class="field-check"><label>QBC</label><input class="chk" type="checkbox" data-field="priceBreakdown.pricingCost.qbc" /></div>
                <div class="field-row cost-row qbc-row pricing-qbc-row has-action">
                  <label>Lower Cost QBC</label>
                  <div class="cost-inputs qbc-inputs">
                    <input class="readonly-field" type="text" readonly data-field="priceBreakdown.pricingCost.lowerCostQbcValue" />
                    <input class="readonly-field percent-input" type="text" placeholder="%" readonly data-field="priceBreakdown.pricingCost.lowerCostQbcPct" />
                  </div>
                  <button class="ghost-btn" type="button">Show Scale</button>
                </div>
              </div>
            </div>

            <div class="card read-card rebate-cost-card">
              <h2>Rebate Cost Information</h2>
              <div class="rebate-grid">
                <div class="rebate-col form-col">
                  <div class="field-row"><label>Comp Cost</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.compCost" /></div>
                  <div class="field-row cost-row load-row">
                    <label>Load Amt</label>
                    <div class="cost-inputs load-inputs">
                      <input class="readonly-field cost-small" type="text" readonly data-field="priceBreakdown.rebateCost.loadAmtValue" />
                      <input class="readonly-field percent-input" type="text" placeholder="%" readonly data-field="priceBreakdown.rebateCost.loadAmtPct" />
                    </div>
                  </div>
                  <div class="field-row"><label>Initial<br />Cost-Rebate</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.initialCostRebate" /></div>
                  <div class="field-row"><label>Cost List ID</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.costListId" /></div>
                  <div class="field-row"><label>Vendor Contract ID</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.vendorContractId" /></div>
                  <div class="field-row"><label>Contract Type</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.contractType" /></div>
                  <div class="field-row"><label>GPO Number/<br />Name</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.gpoNumberName" /></div>
                  <div class="field-check"><label>QBC</label><input class="chk" type="checkbox" data-field="priceBreakdown.rebateCost.qbc" /></div>
                  <div class="field-row cost-row qbc-row rebate-qbc-row has-action">
                    <label>Lower Cost QBC</label>
                    <div class="cost-inputs qbc-inputs">
                      <input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.lowerCostQbcValue" />
                      <input class="readonly-field percent-input" type="text" placeholder="%" readonly data-field="priceBreakdown.rebateCost.lowerCostQbcPct" />
                    </div>
                    <button class="ghost-btn" type="button">Show Scale</button>
                  </div>
                </div>
                <div class="rebate-col form-col">
                  <div class="field-row"><label>Margin Funding</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.marginFunding" /></div>
                  <div class="check-row"><label>Rebatable Used</label><input class="chk" type="checkbox" data-field="priceBreakdown.rebateCost.rebatableUsed" /></div>
                  <div class="field-row"><label>Rebatable Cost</label><input class="readonly-field" type="text" readonly data-field="priceBreakdown.rebateCost.rebatableCost" /></div>
                  <div class="radio-group">
                    <label><input type="radio" name="rebateChoice" value="pricing" data-field="priceBreakdown.rebateCost.choice" checked /> Pricing Cost</label>
                    <label><input type="radio" name="rebateChoice" value="rebate" data-field="priceBreakdown.rebateCost.choice" /> Rebate Cost</label>
                  </div>
                  <div class="button-row">
                    <button class="ghost-outline cost-inquiry-btn" type="button">Cost Inquiry</button>
                    <button class="ghost-outline" type="button">QBC Scale</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-panel" id="additionalInfo" hidden>
          <div class="additional-grid">
            <div class="card read-card">
              <div class="table-grid">
                <div class="table-header table-title">UOM Price Rule Info</div>
                <div class="table-header">Primary</div>
                <div class="table-header">Sell</div>
                <div class="table-header">Buy</div>

                <div class="table-label">UOM</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.uom.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.uom.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.uom.buy" />

                <div class="table-label">Price Rule Level</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleLevel.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleLevel.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleLevel.buy" />

                <div class="table-label">Price</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.price.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.price.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.price.buy" />

                <div class="table-label">GP%</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.gp.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.gp.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.gp.buy" />

                <div class="table-label">Markup %</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.markup.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.markup.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.markup.buy" />

                <div class="table-label">Price Rule Type</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleType.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleType.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleType.buy" />

                <div class="table-label">Price Rule ID</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleId.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleId.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.priceRuleId.buy" />

                <div class="table-label">Reason Code</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.reasonCode.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.reasonCode.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.reasonCode.buy" />

                <div class="table-label">Allow Price Override</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.allowPriceOverride.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.allowPriceOverride.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPriceRuleInfo.allowPriceOverride.buy" />
              </div>

              <div class="table-grid">
                <div class="table-header table-title">UOM Pricing Cost</div>
                <div class="table-header">Primary</div>
                <div class="table-header">Sell</div>
                <div class="table-header">Buy</div>

                <div class="table-label">Initial Costs</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.initialCosts.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.initialCosts.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.initialCosts.buy" />

                <div class="table-label">Pricing Costs</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.pricingCosts.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.pricingCosts.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.pricingCosts.buy" />

                <div class="table-label">Price List ID</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.priceListId.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.priceListId.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.priceListId.buy" />

                <div class="table-label">Vend Cont ID</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.vendContId.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.vendContId.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.vendContId.buy" />

                <div class="table-label">Contract Type</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.contractType.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.contractType.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.contractType.buy" />

                <div class="table-label">GPO Number</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.gpoNumber.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.gpoNumber.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.gpoNumber.buy" />

                <div class="table-label">GPO Name</div>
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.gpoName.primary" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.gpoName.sell" />
                <input class="readonly-field" type="text" readonly data-field="additional.uomPricingCost.gpoName.buy" />
              </div>
            </div>

            <div class="additional-right">
              <div class="card read-card">
                <h2>UOM Differential</h2>
                <div class="table-grid small">
                  <div class="table-header exists-header">
                    <span>Exists Y/N</span>
                    <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.exists" />
                  </div>
                  <div class="table-header">Transaction</div>
                  <div class="table-header">Primary</div>
                  <div class="table-header">Sell</div>

                  <div class="table-label">UOM</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.uom.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.uom.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.uom.sell" />

                  <div class="table-label">Applied Flag</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.appliedFlag.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.appliedFlag.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.appliedFlag.sell" />

                  <div class="table-label">Not Applied Reason</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.notAppliedReason.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.notAppliedReason.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.notAppliedReason.sell" />

                  <div class="table-label">Percent</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.percent.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.percent.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.percent.sell" />

                  <div class="table-label">Amount</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.amount.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.amount.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.amount.sell" />

                  <div class="table-label">Unique ID</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.uniqueId.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.uniqueId.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.uniqueId.sell" />

                  <div class="table-label">Applied Amount</div>
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.appliedAmount.transaction" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.appliedAmount.primary" />
                  <input class="readonly-field" type="text" readonly data-field="additional.uomDifferential.appliedAmount.sell" />
                </div>
              </div>

              <div class="card read-card">
                <h2>UOM Conversions</h2>
                <div class="conversion-grid">
                  <div class="conv-row">
                    <div class="conv-label">1</div>
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row1.col1" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row1.col2" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row1.col3" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row1.col4" />
                  </div>
                  <div class="conv-row">
                    <div class="conv-label">1</div>
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row2.col1" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row2.col2" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row2.col3" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row2.col4" />
                  </div>
                  <div class="conv-row">
                    <div class="conv-label">1</div>
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row3.col1" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row3.col2" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row3.col3" />
                    <input class="readonly-field" type="text" readonly data-field="additional.uomConversions.row3.col4" />
                  </div>
                </div>
              </div>

              <div class="card read-card qbc-info-card">
                <h2>QBC Information</h2>
                <div class="field-row">
                  <label>Item used in QBC</label>
                  <input class="readonly-field" type="text" readonly data-field="additional.qbcInfo.itemUsedInQbc" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-panel" id="govtLimits" hidden>
          <div class="card read-card govt-card">
            <div class="table-grid govt-grid">
              <div class="table-header table-title">Pricing Information</div>
              <div class="table-header">Transaction</div>
              <div class="table-header">Primary</div>
              <div class="table-header">Sell</div>
              <div class="table-header">Buy</div>

              <div class="table-label">UOM</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.uom.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.uom.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.uom.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.uom.buy" />

              <div class="table-label">Ceiling</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceiling.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceiling.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceiling.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceiling.buy" />

              <div class="table-label">Ceiling Level</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingLevel.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingLevel.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingLevel.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingLevel.buy" />

              <div class="table-label">Ceiling Rule ID</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingRuleId.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingRuleId.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingRuleId.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingRuleId.buy" />

              <div class="table-label">Ceiling Reason Code</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingReasonCode.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingReasonCode.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingReasonCode.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingReasonCode.buy" />

              <div class="table-label">Ceiling Notes</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingNotes.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingNotes.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingNotes.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.ceilingNotes.buy" />

              <div class="table-label">Floor</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floor.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floor.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floor.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floor.buy" />

              <div class="table-label">Floor Level</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorLevel.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorLevel.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorLevel.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorLevel.buy" />

              <div class="table-label">Floor Rule ID</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorRuleId.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorRuleId.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorRuleId.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorRuleId.buy" />

              <div class="table-label">Floor Reason Code</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorReasonCode.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorReasonCode.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorReasonCode.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorReasonCode.buy" />

              <div class="table-label">Floor Notes</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorNotes.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorNotes.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorNotes.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.floorNotes.buy" />

              <div class="table-label">Govt List Price</div>
              <input class="readonly-field" type="text" readonly data-field="govtLimits.govtListPrice.transaction" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.govtListPrice.primary" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.govtListPrice.sell" />
              <input class="readonly-field" type="text" readonly data-field="govtLimits.govtListPrice.buy" />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  <script>
    window.__ctx = "${ctx}";
  </script>
  <script src="${ctx}/js/sidebar.js"></script>
  <script src="${ctx}/js/pricing-inquiry.js"></script>
</body>
</html>
