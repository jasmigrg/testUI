<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Home</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css" />
  <link rel="stylesheet" href="${ctx}/css/pricing-inquiry.css" />
  <style>
    .home-card {
      max-width: 760px;
    }

    .home-nav-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .home-nav-link {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 86px;
      width: 100%;
      text-decoration: none;
      text-align: center;
      line-height: 1.3;
      padding: 12px 14px;
    }

    @media (max-width: 900px) {
      .home-nav-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 600px) {
      .home-nav-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <#include "components/header.ftl">
    <#import "/components/page-header.ftl" as pageHeader>

    <#include "/components/sidebar.ftl">
    <@navigation currentPath="/" />

    <main class="content">
      <@pageHeader.render
        title="Home"
        crumbs=[{"label":"Home"}]
      />
      <div class="card home-card">
        <h2>Home</h2>
        <p style="margin: 10px 0 0;">Use the links below to open the demo screens.</p>
        <div class="home-nav-grid">
          <a class="primary home-nav-link" href="${ctx}/pricing-inquiry">Go to Pricing Inquiry</a>
          <a class="primary home-nav-link" href="${ctx}/margin-funding-maintenance">Go to Margin Funding Item Maintenance</a>
          <a class="primary home-nav-link" href="${ctx}/margin-funding-customer-maintenance">Go to Margin Funding Customer Maintenance</a>
          <a class="primary home-nav-link" href="${ctx}/cams-eligibility">Go to CAMS Eligibility</a>
          <a class="primary home-nav-link" href="${ctx}/manage-kvi-recommendation-logic-view-output-data">Go to Manage KVI Recommendation Logic and View Output Data</a>
          <a class="primary home-nav-link" href="${ctx}/price-rules-reason-codes">Go to Price Rules Reason Codes</a>
        </div>
      </div>
    </main>
  </div>
  <script src="${ctx}/js/sidebar.js"></script>
</body>
</html>
