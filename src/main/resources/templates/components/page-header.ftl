<#macro render title crumbs=[] showIcon=true>
  <div class="breadcrumb">
    <#if crumbs?has_content>
      <#list crumbs as crumb>
        <#if crumb.href?? && crumb.href?has_content>
          <a class="crumb-link" href="${crumb.href}">${crumb.label}</a>
        <#else>
          ${crumb.label}
        </#if>
        <#if crumb_has_next> / </#if>
      </#list>
    <#else>
      ${title}
    </#if>
  </div>
  <div class="page-title">
    <#if showIcon>
      <div class="title-icon" aria-hidden="true"></div>
    </#if>
    <h1>${title}</h1>
  </div>
</#macro>
