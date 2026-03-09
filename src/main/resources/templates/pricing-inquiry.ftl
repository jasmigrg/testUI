<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pricing Inquiry</title>
  <link rel="stylesheet" href="/css/pricing-inquiry.css?v=2" />
</head>
<body>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-left">
        <div class="logo">Logo</div>
        <nav class="header-nav">
          <button class="icon-btn" aria-label="Home">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5L12 4l9 7.5v8.5H3z"/></svg>
          </button>
          <button class="icon-btn" aria-label="Dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/></svg>
          </button>
        </nav>
      </div>
      <div class="header-center">
        <div class="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 104.47 10.03l4.25 4.25 1.28-1.28-4.25-4.25A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z"/></svg>
          <input type="search" placeholder="Search" />
        </div>
      </div>
      <div class="header-right">
        <button class="icon-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 00-5 5v3.5L5 14v2h14v-2l-2-2.5V8a5 5 0 00-5-5zm0 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>
        </button>
        <div class="user">
          <div class="user-meta">
            <div class="user-name">User Name</div>
            <div class="user-role">Role 01</div>
          </div>
          <div class="user-avatar">U</div>
        </div>
      </div>
    </header>

    <aside class="sidebar">
      <div class="sidebar-icon active">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/></svg>
      </div>
      <div class="sidebar-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l3 6 6 .9-4.5 4.4 1 6.2L12 17l-5.5 3.4 1-6.2L3 9.9 9 9z"/></svg>
      </div>
      <div class="sidebar-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/></svg>
      </div>
      <div class="sidebar-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v4H6zM6 10h12v10H6z"/></svg>
      </div>
      <div class="sidebar-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v2H5zM5 9h14v2H5zM5 14h14v2H5zM5 19h14v2H5z"/></svg>
      </div>
    </aside>

    <main class="content">
      <div class="breadcrumb">Home / Pricing Inquiry</div>
      <div class="page-title">
        <div class="title-icon"></div>
        <h1>Pricing Inquiry</h1>
      </div>

      <div class="toolbar">
        <button class="tool-btn danger">
          <span class="dot"></span>
        </button>
        <button class="tool-btn">Clear</button>
        <button class="tool-btn">Form</button>
        <button class="tool-btn">Tools</button>
      </div>

      <section class="card-grid">
        <div class="card inputs-card">
          <h2>Inputs</h2>
          <div class="form-col">
            <div class="field-row">
              <label>Customer</label>
              <input class="input-field" type="text" />
            </div>
            <div class="field-row">
              <label>Item Number</label>
              <input class="input-field" type="text" />
            </div>
            <div class="field-row">
              <label>Cat Number</label>
              <input class="input-field" type="text" />
            </div>
            <div class="field-row">
              <label>Order Quantity</label>
              <input class="input-field" type="text" />
            </div>
            <div class="field-row">
              <label>UOM</label>
              <input class="input-field" type="text" />
            </div>
            <div class="field-row">
              <label>Price Date</label>
              <div class="input-date">
                <input class="input-field date-display" type="text" placeholder="mm/dd/yyyy" />
                <input class="date-hidden" type="date" aria-label="Pick date" />
                <button class="calendar-btn" type="button" aria-label="Pick date"></button>
              </div>
            </div>
            <button class="primary" type="button">Get Price</button>
          </div>
        </div>

        <div class="card customer-card">
          <h2>Customer Information</h2>
          <div class="form-two-col">
            <div class="span-2">
              <div class="field-row wide-input">
                <label>Customer Name</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div class="span-2">
              <div class="field-row">
                <label>Bill To, Name, PCCA</label>
                <div class="triple-input">
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                </div>
              </div>
            </div>
            <div class="span-2">
              <div class="field-row">
                <label>PRCA, Name, PCCA</label>
                <div class="triple-input">
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                </div>
              </div>
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>Segment</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>Cluster</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>Market</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>FSS Grp</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div class="check-row">
              <label>Bill to Pricing</label>
              <input type="checkbox" checked />
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>FSS Type</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div class="check-row">
              <label>Multi Bill to PRCA</label>
              <input type="checkbox" checked />
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>Government<br />Department</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div>
              <div class="field-row cust-wide-row">
                <label>Primary GPO<br />Affiliation</label>
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div></div>
          </div>
        </div>

        <div class="card item-card">
          <h2>Item Information</h2>
          <div class="form-col">
            <div class="field-row">
              <label>Item Description</label>
              <input class="readonly-field" type="text" readonly />
            </div>
            <div class="field-row">
              <label>Supplier Name</label>
              <input class="readonly-field" type="text" readonly />
            </div>
            <div class="field-row">
              <label>Supplier Number</label>
              <input class="readonly-field" type="text" readonly />
            </div>
            <div class="item-inline-row">
              <label class="inline-label">McKesson Brand</label>
              <input class="inline-check" type="checkbox" checked />
              <label class="inline-label">Sales Group</label>
              <input class="readonly-field" type="text" readonly />
            </div>
            <div class="field-row">
              <label>Stocking Type</label>
              <input class="readonly-field" type="text" readonly />
            </div>
            <div class="field-row">
              <label>Comp Category</label>
              <input class="readonly-field" type="text" readonly />
            </div>
            <div class="field-row">
              <label>Product Family</label>
              <div class="double-input">
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>
            <div class="field-row">
              <label>Product Category</label>
              <div class="double-input">
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
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
                <div class="field-row"><label>Sell Price</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Comp Margin%</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Pricing Margin%</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Cost Plus%</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Govt List Price</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Last Price Paid</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Ceiling/Floor<br />Price</label><div class="double-input"><input class="readonly-field" type="text" readonly /><input class="readonly-field" type="text" readonly /></div></div>
              </div>
            </div>

            <div class="card read-card price-rule-card">
              <h2>Price Rule Information</h2>
              <div class="form-col">
                <div class="field-row"><label>ID</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row level-row">
                  <label>Level</label>
                  <div class="level-inputs">
                    <input class="readonly-field level-small" type="text" readonly />
                    <input class="readonly-field level-wide" type="text" readonly />
                  </div>
                </div>
                <div class="field-row inline-check-row">
                  <label>Type</label>
                  <input class="readonly-field pr-short" type="text" readonly />
                  <div class="check-row">
                    <label>Ship to Pricing</label>
                    <input class="chk" type="checkbox" checked />
                  </div>
                </div>
                <div class="field-row inline-check-row">
                  <label>Markup%</label>
                  <input class="readonly-field pr-short" type="text" readonly />
                  <div class="check-row">
                    <label>Apply Loads to Pricing Cost</label>
                    <input class="chk" type="checkbox" checked />
                  </div>
                </div>
                <div class="field-row"><label>Reason Code</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Notes</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Effective Date</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Termination Date</label><input class="readonly-field" type="text" readonly /></div>
              </div>
            </div>

            <div class="card read-card uom-card">
              <h2>UOM Differential</h2>
              <div class="form-col">
                <div class="field-row"><label>Exists</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Applied</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Not Applied Reason</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Unique ID</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Percent</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Amount</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Applied Amount</label><input class="readonly-field" type="text" readonly /></div>
              </div>
            </div>

            <div class="card read-card">
              <h2>Pricing Cost Information</h2>
              <div class="form-col">
                <div class="field-row"><label>Pricing Cost</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row cost-row load-row">
                  <label>Load Amt</label>
                  <div class="cost-inputs load-inputs">
                    <input class="readonly-field cost-small" type="text" readonly />
                    <input class="readonly-field percent-input" type="text" placeholder="%" readonly />
                  </div>
                </div>
                <div class="field-row"><label>Initial<br />Cost-Pricing</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Price List ID</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Vendor Contract ID</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>Contract Type</label><input class="readonly-field" type="text" readonly /></div>
                <div class="field-row"><label>GPO Number/<br />Name</label><input class="readonly-field" type="text" readonly /></div>
                <div class="check-row"><label>QBC</label><input class="chk" type="checkbox" checked /></div>
                <div class="field-row cost-row qbc-row pricing-qbc-row">
                  <label>Lower Cost QBC</label>
                  <div class="cost-inputs qbc-inputs">
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field percent-input" type="text" placeholder="%" readonly />
                  </div>
                  <button class="ghost-btn" type="button">Show Scale</button>
                </div>
              </div>
            </div>

            <div class="card read-card">
              <h2>Rebate Cost Information</h2>
              <div class="rebate-grid">
                <div class="rebate-col form-col">
                  <div class="field-row"><label>Comp Cost</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="field-row cost-row load-row">
                    <label>Load Amt</label>
                    <div class="cost-inputs load-inputs">
                      <input class="readonly-field cost-small" type="text" readonly />
                      <input class="readonly-field percent-input" type="text" placeholder="%" readonly />
                    </div>
                  </div>
                  <div class="field-row"><label>Initial<br />Cost-Rebate</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="field-row"><label>Cost List ID</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="field-row"><label>Vendor Contract ID</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="field-row"><label>Contract Type</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="field-row"><label>GPO Number/<br />Name</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="check-row"><label>QBC</label><input class="chk" type="checkbox" checked /></div>
                  <div class="field-row cost-row qbc-row rebate-qbc-row">
                    <label>Lower Cost QBC</label>
                    <div class="cost-inputs qbc-inputs">
                      <input class="readonly-field" type="text" readonly />
                      <input class="readonly-field percent-input" type="text" placeholder="%" readonly />
                    </div>
                    <button class="ghost-btn" type="button">Show Scale</button>
                  </div>
                </div>
                <div class="rebate-col form-col">
                  <div class="field-row"><label>Margin Funding</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="check-row"><label>Rebatable Used</label><input class="chk" type="checkbox" checked /></div>
                  <div class="field-row"><label>Rebatable Cost</label><input class="readonly-field" type="text" readonly /></div>
                  <div class="radio-group">
                    <label><input type="radio" name="rebateChoice" checked /> Pricing Cost</label>
                    <label><input type="radio" name="rebateChoice" /> Rebate Cost</label>
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
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Price Rule Level</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Price</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">GP%</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Markup %</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Price Rule Type</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Price Rule ID</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Reason Code</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Allow Price Override</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
              </div>

              <div class="table-grid">
                <div class="table-header table-title">UOM Pricing Cost</div>
                <div class="table-header">Primary</div>
                <div class="table-header">Sell</div>
                <div class="table-header">Buy</div>

                <div class="table-label">Initial Costs</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Pricing Costs</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Price List ID</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Vend Cont ID</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">Contract Type</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">GPO Number</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />

                <div class="table-label">GPO Name</div>
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
                <input class="readonly-field" type="text" readonly />
              </div>
            </div>

            <div class="additional-right">
              <div class="card read-card">
                <h2>UOM Differential</h2>
                <div class="table-grid small">
                  <div class="table-header exists-header">
                    <span>Exists Y/N</span>
                    <input class="readonly-field" type="text" readonly />
                  </div>
                  <div class="table-header">Transaction</div>
                  <div class="table-header">Primary</div>
                  <div class="table-header">Sell</div>

                  <div class="table-label">UOM</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />

                  <div class="table-label">Applied Flag</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />

                  <div class="table-label">Not Applied Reason</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />

                  <div class="table-label">Percent</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />

                  <div class="table-label">Amount</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />

                  <div class="table-label">Unique ID</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />

                  <div class="table-label">Applied Amount</div>
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                  <input class="readonly-field" type="text" readonly />
                </div>
              </div>

              <div class="card read-card">
                <h2>UOM Conversions</h2>
                <div class="conversion-grid">
                  <div class="conv-row">
                    <div class="conv-label">1</div>
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                  </div>
                  <div class="conv-row">
                    <div class="conv-label">1</div>
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                  </div>
                  <div class="conv-row">
                    <div class="conv-label">1</div>
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                    <input class="readonly-field" type="text" readonly />
                  </div>
                </div>
              </div>

              <div class="card read-card qbc-info-card">
                <h2>QBC Information</h2>
                <div class="field-row">
                  <label>Item used in QBC</label>
                  <input class="readonly-field" type="text" readonly />
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
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Ceiling</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Ceiling Level</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Ceiling Rule ID</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Ceiling Reason Code</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Ceiling Notes</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Floor</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Floor Level</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Floor Rule ID</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Floor Reason Code</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Floor Notes</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />

              <div class="table-label">Govt List Price</div>
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
              <input class="readonly-field" type="text" readonly />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  <script src="/js/pricing-inquiry.js?v=1"></script>
</body>
</html>
